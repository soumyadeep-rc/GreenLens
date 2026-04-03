import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/models.js";
import { getBlockchainBalance } from "../../rewardUser.js";

export const redeemItem = asyncHandler(async (req, res) => {
  const clerkId = req.auth.userId;
  const user = await User.findOne({ clerkId });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.walletAddress) {
    throw new ApiError(400, "No Web3 Wallet connected");
  }

  try {
    const realBalance = await getBlockchainBalance(user.walletAddress);

    user.greenTokens = realBalance;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
      new ApiResponse(
        200,
        { newTotalTokens: user.greenTokens },
        "Database successfully synced with Smart Contract after burn."
      )
    );
  } catch (error) {
    throw new ApiError(500, "Failed to sync Web3 balance");
  }
});