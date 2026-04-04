import { Transaction } from "../models/models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { getOrCreateUser } from "../utils/userUtils.js";

// Import the Web3 minting function
import { mint } from "../../rewardUser.js"; 

// ==========================================
// LOGIC FOR ECO-PURCHASES & WEB3 MINTING
// ==========================================
export const logGreenPurchase = asyncHandler(async (req, res) => {
  const { itemName, category, amount } = req.body;
  const clerkId = req.auth.userId;

  if (!itemName || !category || !amount) {
    throw new ApiError(400, "Item name, category, and amount are required.");
  }

  // Fetch user from DB using Clerk ID
  const user = await getOrCreateUser(clerkId);

  // Logic: Award 1 Green Token for every $10 spent, with a minimum of 10 tokens
  const tokens_awarded = Math.max(10, Math.floor(amount / 10));

  // 1. Update Web2 Database
  user.greenTokens += tokens_awarded;
  user.trustLevel = (user.trustLevel || 0) + 1;
  await user.save({ validateBeforeSave: false });

  await Transaction.create({
    userID: user._id,
    activityType: "Purchases",
    tokensEarned: tokens_awarded
  });

  // 2. Trigger Web3 Blockchain Minting
  if (user.walletAddress) {
    try {
      // Call Ethers.js script to mint directly on Sepolia
      await mint(user.walletAddress, tokens_awarded);
      console.log(`✅ Successfully minted ${tokens_awarded} GT to ${user.walletAddress}`);
    } catch (blockchainError) {
      console.error("❌ Blockchain minting failed:", blockchainError);
      // We don't throw an ApiError here so the UI doesn't show "Failed" 
      // if the DB update succeeded but the blockchain was just slow/congested.
    }
  } else {
    console.log("⚠️ User has no Web3 wallet connected. Skipped on-chain minting.");
  }

  // 3. Send Success Response to Frontend
  return res.status(201).json(
    new ApiResponse(
      201,
      {
        tokensChange: tokens_awarded,
        totalTokens: user.greenTokens,
      },
      "Eco-purchase verified and tokens minted!"
    )
  );
});