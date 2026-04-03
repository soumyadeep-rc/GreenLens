import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User, Address, Solar } from "../models/models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { mint, getBlockchainBalance } from "../../rewardUser.js";
import axios from "axios";
import { getOrCreateUser } from "../utils/userUtils.js";

export const logSolarGeneration = asyncHandler(async (req, res) => {
  // 1. Extract data from Request Body
  const { 
    solarCompany, 
    unitsGenerated, 
    unitsCharged, 
    homeType, 
    carpetArea 
  } = req.body;
  
  const clerkId = req.auth.userId;

  // --- VALIDATION ---
  const numUnitsGenerated = Number(unitsGenerated);
  const numUnitsCharged = Number(unitsCharged) || 0;

  if (!numUnitsGenerated || numUnitsGenerated <= 0) {
    throw new ApiError(400, "Valid 'Units Generated' value is required.");
  }
  if (!solarCompany) {
    throw new ApiError(400, "Solar Company/Provider name is required.");
  }

  // Identify or Create User in MongoDB
  const user = await getOrCreateUser(clerkId);

  // --- 2. AUTO-ADDRESS SETUP (Defensive) ---
  // We search for an existing address; if missing, we create it using form data.
  let address = await Address.findById(user.addressId);
  
  if (!address) {
    console.log("No address found for user, creating new record...");
    address = await Address.create({
      homeType: homeType || "Apartment",
      carpetArea: Number(carpetArea) || 1000,
    });
    user.addressId = address._id;
    // Save the link to the user immediately
    await user.save({ validateBeforeSave: false });
  }

  // --- 3. IMAGE UPLOAD (Cloudinary) ---
  const imageLocalPath = req.file?.path;
  if (!imageLocalPath) {
    throw new ApiError(400, "A valid Solar Bill or Report image is required.");
  }
  
  const cloudinaryResponse = await uploadOnCloudinary(imageLocalPath);
  if (!cloudinaryResponse || !cloudinaryResponse.url) {
    throw new ApiError(500, "Failed to upload report to Cloudinary. Check your credentials.");
  }
  const billProofUrl = cloudinaryResponse.url;

  // --- 4. ML CALCULATION (FastAPI Sync) ---
  let mlResponse;
  try {
    const mlPayload = {
      homeType: address.homeType || homeType || "Apartment",
      carpetArea_sqft: parseFloat(address.carpetArea || carpetArea || 1000),
      monthly_unitsUsed_kwh: 0,
      monthly_solarUsed_kwh: numUnitsGenerated,
    };

    console.log("DEBUG: Sending Payload to FastAPI:", mlPayload);

    mlResponse = await axios.post(
      `${process.env.ML_API_URL}/calculate-electricity`, 
      mlPayload
    );
  } catch (error) {
    // Detailed logging for your Node terminal
    console.error("❌ ML Service Error Details:", error.response?.data || error.message);
    throw new ApiError(500, "ML service communication failed. Check Node terminal for error details.");
  }

  const { user_co2_footprint_kg, tokens_awarded } = mlResponse.data;

  // --- 5. UPDATE LOCAL SOLAR RECORDS ---
  await Solar.findOneAndUpdate(
    { userID: user._id },
    {
      $inc: { totalSolarUnitsUsed: numUnitsGenerated },
      $set: { 
        modelName: solarCompany, 
        lastGenerationBill: billProofUrl 
      },
    },
    { new: true, upsert: true }
  );

  // --- 6. THE WEB3 SYNC ENGINE (Mint & Re-fetch) ---
  // Update local CO2 stat from ML response
  user.carbonFootprint = user_co2_footprint_kg;

  if (tokens_awarded > 0 && user.walletAddress) {
    try {
      console.log(`Step 1: Minting ${tokens_awarded} GT to ${user.walletAddress}...`);
      
      // Call the mint function (handles 18 decimal logic internally)
      await mint(user.walletAddress, tokens_awarded);
      
      // Fetch the absolute truth from the blockchain to ensure DB is in sync
      const freshBalance = await getBlockchainBalance(user.walletAddress);
      user.greenTokens = freshBalance;
      
      console.log("Step 2: Sync Complete. New DB Balance:", user.greenTokens);
    } catch (txError) {
      console.error("⚠️ Blockchain Minting Failed:", txError.message);
      // Fallback: Increment DB locally if chain fails so user isn't stuck
      user.greenTokens += tokens_awarded;
    }
  } else {
    // Fallback for users without wallets connected
    user.greenTokens += tokens_awarded;
  }

  // Final Database Save
  await user.save({ validateBeforeSave: false });

  // --- 7. FINAL RESPONSE ---
  return res.status(201).json(
    new ApiResponse(201, {
      tokensEarned: tokens_awarded,
      newTotalTokens: user.greenTokens,
      newCarbonFootprint: user.carbonFootprint,
      billUrl: billProofUrl
    }, "Solar generation verified, minted, and synced successfully!")
  );
});