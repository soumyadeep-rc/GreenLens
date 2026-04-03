import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User, Address } from "../models/models.js";

export const updateUserProfile = asyncHandler(async (req, res) => {
  // 1. Get the authenticated user
  const clerkId = req.auth.userId;
  const user = await User.findOne({ clerkId });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 2. Separate the data from the request body
  const {
    // User fields
    fullName, 
    ph1,
    ph2,
    dob,
    gender,
    adhaar,
    walletAddress, // <--- ADDED THIS

    // Address fields
    address,
    city,
    state,
    pinCode,
    nationality,
    carpetArea,
    homeType,
    tenure,
    storey,
    floorNo,
  } = req.body;

  // 3. Create or Update the Address
  const addressUpdate = {
    address,
    city,
    state,
    pinCode,
    nationality,
    carpetArea,
    homeType,
    tenure,
    storey,
    floorNo,
  };

  const updatedAddress = await Address.findOneAndUpdate(
    { _id: user.addressId }, 
    { $set: addressUpdate }, 
    { new: true, upsert: true } 
  );

  // 4. Update the User document
  user.fullName = fullName || user.fullName; 
  user.ph1 = ph1 || user.ph1;
  user.ph2 = ph2 || user.ph2;
  user.dob = dob || user.dob;
  user.gender = gender || user.gender;
  user.adhaar = adhaar || user.adhaar;
  user.walletAddress = walletAddress || user.walletAddress; // <--- ADDED THIS
  user.addressId = updatedAddress._id; 

  await user.save({ validateBeforeSave: false });

  // 5. Return the updated user
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile updated successfully"));
});