import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
  User,
  Vehicle,
  Forestation,
  VehicleRun,
  ElectricityUsage,
  Address,
  Solar,
  Transaction // ✅ ADDED TRANSACTION MODEL
} from "../models/models.js";

import { getOrCreateUser } from "../utils/userUtils.js";

// --- Update Wallet Address ---
// This bridges the gap between MetaMask and your MongoDB
export const updateWalletAddress = asyncHandler(async (req, res) => {
  const { walletAddress } = req.body;
  const clerkId = req.auth.userId;

  if (!walletAddress) {
    throw new ApiError(400, "Wallet address is required.");
  }

  // Find user via your existing utility
  const user = await getOrCreateUser(clerkId);

  // Update and save
  user.walletAddress = walletAddress.toLowerCase();
  await user.save({ validateBeforeSave: false });

  console.log(`✅ Wallet synced in DB for: ${user.email}`);

  return res.status(200).json(
    new ApiResponse(200, { walletAddress: user.walletAddress }, "Wallet address updated successfully")
  );
});

// --- Get Leaderboard (Top 10 Users) ---
export const getLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await User.find({})
    .sort({ greenTokens: -1 })
    .limit(10)
    .select("fullName avatarUrl greenTokens badges");

  return res
    .status(200)
    .json(new ApiResponse(200, leaderboard, "Leaderboard fetched successfully"));
});

// --- Get User Dashboard ---
export const getUserDashboard = asyncHandler(async (req, res) => {
  const clerkId = req.auth.userId;
  
  if (!clerkId) {
    throw new ApiError(401, "Unauthorized request");
  }

  let user = await getOrCreateUser(clerkId);
  user = await user.populate("addressId");
  const userId = user._id;

  // 1. Fetch auxiliary data for CO2 and Impact calculations
  const [vehicles, forestationData, vehicleRuns, solarData] =
    await Promise.all([
      Vehicle.find({ userID: userId }),
      Forestation.find({ userID: userId }), 
      VehicleRun.find({ userID: userId }),
      Solar.find({ userID: userId }), 
    ]);

  // 2. Generate the "Last 6 Months" array skeleton for the line chart
  const today = new Date();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const last6Months = [];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    last6Months.push({
      month: monthNames[d.getMonth()],
      year: d.getFullYear(),
      monthNum: d.getMonth() + 1, // 1-12
      tokens: 0 // Default to 0
    });
  }

  // 3. ✅ PULL REAL GRAPH DATA: Aggregate Monthly Tokens from the Transaction DB
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

  const monthlyData = await Transaction.aggregate([
    { 
      $match: { 
        userID: userId, 
        createdAt: { $gte: sixMonthsAgo } 
      } 
    },
    { 
      $group: { 
        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, 
        totalTokens: { $sum: "$tokensEarned" } 
      } 
    }
  ]);

  // Merge the DB data into our empty 6-month calendar
  monthlyData.forEach(data => {
    const targetMonth = last6Months.find(m => m.monthNum === data._id.month && m.year === data._id.year);
    if (targetMonth) {
      targetMonth.tokens = data.totalTokens;
    }
  });

  // Strip out the year/monthNum so the frontend just gets { month: "Apr", tokens: 550 }
  const monthlyTokens = last6Months.map(m => ({ month: m.month, tokens: m.tokens }));

  // 4. ✅ PULL REAL PIE CHART DATA: Aggregate Token Breakdown by Activity
  const breakdownData = await Transaction.aggregate([
    { $match: { userID: userId } },
    { $group: { _id: "$activityType", value: { $sum: "$tokensEarned" } } }
  ]);

  const activityBreakdown = breakdownData.map(item => ({
    name: item._id,
    value: item.value
  }));

  // Fallback if no transactions exist yet
  if (activityBreakdown.length === 0) {
    activityBreakdown.push({ name: 'No Activity', value: 1 });
  }

  // 5. Accurate Total Submissions (Based on actual transactions)
  const totalSubmissions = await Transaction.countDocuments({ userID: userId });

  // 6. Calculate CO2 Savings (Preserving your original math)
  const treesPlanted = forestationData.length > 0 ? forestationData[0].totalPlants : 0;
  const treeSavings = treesPlanted * 21; 
  const solarUnits = solarData.length > 0 ? (solarData[0].totalSolarUnitsUsed || 0) : 0;
  const solarSavings = solarUnits * 0.85;

  let evSavings = 0;
  vehicles.forEach(v => {
      if(v.isEV) {
          const run = vehicleRuns.find(r => r.vehicleID.toString() === v._id.toString());
          if(run) evSavings += (run.totalKMCovered || 0) * 0.12;
      }
  });

  // Assemble Payload
  const dashboardData = {
    profile: {
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      trustLevel: user.trustLvl,
      badges: user.badges,
      address: user.addressId, 
      walletAddress: user.walletAddress, 
    },
    totalGreenTokens: user.greenTokens, 
    currentCarbonFootprint: user.carbonFootprint,
    monthlyTokens: monthlyTokens,
    activityBreakdown: activityBreakdown,
    totalSubmissions: totalSubmissions,
    treesPlanted: treesPlanted,
    co2Saved: Math.round(treeSavings + solarSavings + evSavings),
    vehicles: vehicles,
  };

  return res.status(200).json(new ApiResponse(200, dashboardData, "Dashboard data fetched successfully"));
});