import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
// ✅ IMPORTED TRANSACTION
import { User, Address, Transaction } from "../models/models.js"; 
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { mint, getBlockchainBalance } from "../../rewardUser.js"; 
import axios from "axios";
import { getOrCreateUser } from "../utils/userUtils.js";

export const logElectricityBill = asyncHandler(async (req, res) => {
  console.log("--- [1] Electricity Controller Started ---");
  
  const { unitsUsed, homeType, carpetArea } = req.body;
  const clerkId = req.auth.userId;

  const numUnitsUsed = parseFloat(unitsUsed);
  if (isNaN(numUnitsUsed)) throw new ApiError(400, "Units used must be a number.");

  const user = await getOrCreateUser(clerkId);

  // 1. Get or Update Address
  let address = await Address.findById(user.addressId);
  if (!address) {
    console.log("DEBUG: Creating fresh address record...");
    address = await Address.create({
      homeType: homeType || "Apartment",
      carpetArea: Number(carpetArea) || 1000,
    });
    user.addressId = address._id;
    await user.save({ validateBeforeSave: false });
  }

  // 2. Image Upload
  const billLocalPath = req.file?.path;
  if (!billLocalPath) throw new ApiError(400, "Bill image required.");
  const cloudinaryResponse = await uploadOnCloudinary(billLocalPath);
  if (!cloudinaryResponse) throw new ApiError(500, "Upload failed.");

  // 3. ML Calculation (With explicit Timeout and 127.0.0.1)
  let mlResponse;
  try {
    const payload = {
      homeType: address.homeType || "Apartment",
      carpetArea_sqft: parseFloat(address.carpetArea || 1000),
      monthly_unitsUsed_kwh: numUnitsUsed,
      monthly_solarUsed_kwh: 0.0 
    };

    console.log("DEBUG: Requesting ML at:", `${process.env.ML_API_URL}/calculate-electricity`);
    
    mlResponse = await axios.post(
      `${process.env.ML_API_URL}/calculate-electricity`, 
      payload,
      { timeout: 5000 } // Don't let it hang more than 5 seconds
    );
    console.log("DEBUG: ML Response received successfully.");
  } catch (error) {
    console.error("❌ ML Error:", error.response?.data || error.message);
    throw new ApiError(500, `ML Service error: ${error.message}`);
  }

  const { user_co2_footprint_kg, tokens_awarded } = mlResponse.data;

  // 4. Web3 Sync Engine
  user.carbonFootprint = user_co2_footprint_kg;
  
  if (tokens_awarded > 0 && user.walletAddress) {
    try {
      console.log(`--- [4] Minting ${tokens_awarded} GT to ${user.walletAddress} ---`);
      
      const txHash = await mint(user.walletAddress, tokens_awarded);
      console.log(`DEBUG: Minting confirmed! Hash: ${txHash}`);
      
      const freshBalance = await getBlockchainBalance(user.walletAddress);
      user.greenTokens = freshBalance;
      console.log(`DEBUG: New Balance synced: ${freshBalance}`);
    } catch (txError) {
      console.error("❌ Web3 Error:", txError.message);
      user.greenTokens += tokens_awarded; // Fallback
    }
  } else {
    console.log("DEBUG: Skipping Web3 (No tokens or no wallet).");
    user.greenTokens += (tokens_awarded || 0);
  }

  // ✅ 5. TRANSACTION RECEIPT FOR DASHBOARD GRAPHS
  if (tokens_awarded > 0) {
    await Transaction.create({
      userID: user._id,
      activityType: "Electricity",
      tokensEarned: tokens_awarded
    });
    console.log(`DEBUG: Transaction logged for Dashboard Graphs.`);
  }

  await user.save({ validateBeforeSave: false });
  console.log("--- [6] Success! ---");

  return res.status(201).json(
    new ApiResponse(201, {
      tokensEarned: tokens_awarded,
      newTotalTokens: user.greenTokens,
      newCarbonFootprint: user.carbonFootprint
    }, "Electricity rewards processed!")
  );
});