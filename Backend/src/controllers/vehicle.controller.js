import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User, Vehicle, VehicleRun, Transaction } from "../models/models.js";
import { mint, getBlockchainBalance } from "../../rewardUser.js";

// ==========================================
// NATIVE REWARD CALCULATION ENGINE
// ==========================================
const calculateTravelRewards = (vehicleType, isEV, distance) => {
  let tokens_awarded = 0;
  let user_co2_footprint_kg = 0;

  if (vehicleType === "Cycle") {
    tokens_awarded = Math.floor(distance * 5); 
    user_co2_footprint_kg = 0;
  } else if (vehicleType === "Public Transport") {
    tokens_awarded = Math.floor(distance * 2);
    user_co2_footprint_kg = distance * 0.05; 
  } else if (vehicleType === "Car" || vehicleType === "4 Wheeler") {
    if (isEV) {
      tokens_awarded = Math.floor(distance * 2);
      user_co2_footprint_kg = 0;
    } else {
      tokens_awarded = -Math.ceil(distance * 2); // Penalty for non-EV car
      user_co2_footprint_kg = distance * 0.2;
    }
  } else if (vehicleType === "Scooter" || vehicleType === "2 Wheeler") {
    if (isEV) {
      tokens_awarded = Math.floor(distance * 2);
      user_co2_footprint_kg = 0;
    } else {
      tokens_awarded = -Math.ceil(distance * 1); // Penalty for non-EV bike
      user_co2_footprint_kg = distance * 0.1;
    }
  }

  return { tokens_awarded, user_co2_footprint_kg };
};


export const handleTransportForm = asyncHandler(async (req, res) => {
  const clerkId = req.auth.userId;
  const user = await User.findOne({ clerkId });
  if (!user) throw new ApiError(404, "User not found.");

  const { isEv, vehicleType, kmCovered, vehicleNumber, odometerReading, vehicleModel } = req.body;

  if (!vehicleType) throw new ApiError(400, "Vehicle type is required.");

  // --- LOGIC PATH A: Public Transport or Cycle ---
  if (vehicleType === "Public Transport" || vehicleType === "Cycle") {
    const numDistance = Number(kmCovered);
    if (!numDistance || numDistance <= 0) throw new ApiError(400, "A valid distance is required.");

    // ✅ USE NATIVE LOGIC
    const { tokens_awarded, user_co2_footprint_kg } = calculateTravelRewards(vehicleType, false, numDistance);

    user.greenTokens += tokens_awarded;
    user.carbonFootprint = (user.carbonFootprint || 0) + user_co2_footprint_kg;

    if (tokens_awarded > 0) {
        await Transaction.create({ userID: user._id, activityType: "Transport", tokensEarned: tokens_awarded });
    }

    if (user.walletAddress && tokens_awarded > 0) {
      try {
        await mint(user.walletAddress, tokens_awarded);
        user.greenTokens = await getBlockchainBalance(user.walletAddress);
      } catch (err) { console.error("Minting failed:", err); }
    }

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
      new ApiResponse(200, {
          distanceLogged: numDistance,
          tokensEarned: tokens_awarded,
          co2Footprint: user_co2_footprint_kg,
          newTotalTokens: user.greenTokens,
        }, `✅ Trip logged! Earned ${tokens_awarded} Points for ${numDistance} km!`
      )
    );
  }

  // --- LOGIC PATH B: Personal Vehicle (4 Wheeler / 2 Wheeler) ---
  if (!vehicleNumber || odometerReading === undefined) {
    throw new ApiError(400, "Vehicle Number and Odometer Reading are required.");
  }
  const numOdometer = Number(odometerReading);
  const existingVehicle = await Vehicle.findOne({ vehicleNumber: vehicleNumber, userID: user._id });

  // --- 3a. If Vehicle EXISTS: UPDATE ODOMETER ---
  if (existingVehicle) {
    const run = await VehicleRun.findOne({ vehicleID: existingVehicle._id });
    if (!run) throw new ApiError(404, "Vehicle run data not found.");
    if (numOdometer < run.lastOdometer) throw new ApiError(400, `Odometer must be > ${run.lastOdometer} km.`);

    const distanceForThisTrip = numOdometer - run.lastOdometer;
    if (distanceForThisTrip === 0) {
      return res.status(200).json(new ApiResponse(200, { distanceLogged: 0, tokensEarned: 0 }, "No new distance logged."));
    }

    // ✅ USE NATIVE LOGIC
    const { tokens_awarded, user_co2_footprint_kg } = calculateTravelRewards(existingVehicle.type, existingVehicle.isEV, distanceForThisTrip);

    // Update Run Data
    const today = new Date();
    const firstDayOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    let pastMonthTotal = run.pastMonthKMCover;
    let currentMonthTotal = run.currentMonthKMCover;

    if (run.currentMonthStartDate < firstDayOfThisMonth) {
      pastMonthTotal = run.currentMonthKMCover;
      currentMonthTotal = distanceForThisTrip;
    } else {
      currentMonthTotal += distanceForThisTrip;
    }

    run.lastOdometer = numOdometer;
    run.totalKMCovered += distanceForThisTrip;
    run.currentMonthKMCover = currentMonthTotal;
    run.pastMonthKMCover = pastMonthTotal;
    run.currentMonthStartDate = firstDayOfThisMonth;
    await run.save();

    user.greenTokens += tokens_awarded;
    user.carbonFootprint = (user.carbonFootprint || 0) + user_co2_footprint_kg;

    if (tokens_awarded > 0) {
        await Transaction.create({ userID: user._id, activityType: "Transport", tokensEarned: tokens_awarded });
    }

    if (user.walletAddress && tokens_awarded > 0) {
      try {
        await mint(user.walletAddress, tokens_awarded);
        user.greenTokens = await getBlockchainBalance(user.walletAddress);
      } catch (err) { console.error("Minting failed:", err); }
    }

    await user.save({ validateBeforeSave: false });

    let message = tokens_awarded >= 0 
      ? `✅ Trip logged! Earned ${tokens_awarded} Points for ${distanceForThisTrip} km!`
      : `⚠️ Trip logged. ${Math.abs(tokens_awarded)} Points deducted for non-EV emissions.`;

    return res.status(200).json(
      new ApiResponse(200, {
          distanceLogged: distanceForThisTrip,
          tokensEarned: tokens_awarded,
          co2Footprint: user_co2_footprint_kg,
          newTotalTokens: user.greenTokens,
        }, message
      )
    );
  }

  // --- 3b. Vehicle NEW: ADD VEHICLE ---
  else {
    if (!vehicleModel) throw new ApiError(400, "Vehicle Model is required.");
    if (isEv === undefined) throw new ApiError(400, "EV status is required.");

    const mappedVehicleType = vehicleType === "4 Wheeler" ? "Car" : "Scooter"; 

    const newVehicle = await Vehicle.create({
      userID: user._id,
      isEV: isEv, 
      modelName: vehicleModel, 
      type: mappedVehicleType, 
      vehicleNumber: vehicleNumber,
    });

    await VehicleRun.create({
      vehicleID: newVehicle._id,
      lastOdometer: numOdometer,
      totalKMCovered: 0,
      currentMonthKMCover: 0,
      pastMonthKMCover: 0,
      currentMonthStartDate: new Date(),
    });

    return res.status(201).json(
      new ApiResponse(201, { 
          vehicle: newVehicle,
          distanceLogged: 0,
          tokensEarned: 0 
      }, "Vehicle registered successfully! Log your next trip to earn tokens.")
    );
  }
});