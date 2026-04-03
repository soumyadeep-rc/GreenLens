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
  Solar
} from "../models/models.js";

import { getOrCreateUser } from "../utils/userUtils.js";

// --- [NEW] Update Wallet Address ---
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
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Fetch all relevant data
  const [vehicles, forestationData, vehicleRuns, electricBills, solarData] =
    await Promise.all([
      Vehicle.find({ userID: userId }),
      Forestation.find({ userID: userId }), 
      VehicleRun.find({ userID: userId }),
      ElectricityUsage.find({ userID: userId }),
      Solar.find({ userID: userId }), 
    ]);

  const getMonthName = (date) => {
      if(!date) return 'Unknown';
      const d = new Date(date);
      return d.toLocaleString('default', { month: 'short' });
  };

  const monthlyMap = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = d.toLocaleString('default', { month: 'short' });
    monthlyMap[monthKey] = 0;
  }

  const addPoints = (date, points) => {
      const m = getMonthName(date);
      if (monthlyMap[m] !== undefined) {
          monthlyMap[m] += points;
      }
  };

  let transportPoints = 0, electricPoints = 0, solarPoints = 0, plantationPoints = 0;

  vehicleRuns.forEach(run => {
      const p = Math.floor((run.currentMonthKMCover || 0) * 2); 
      addPoints(run.updatedAt || run.createdAt, p);
      transportPoints += p;
  });

  electricBills.forEach(bill => {
      const p = 50; 
      addPoints(bill.createdAt, p);
      electricPoints += p;
  });

  solarData.forEach(s => {
      const net = Math.max(0, (s.unitsGenerated || 0) - (s.unitsCharged || 0));
      const p = Math.floor(net / 5);
      addPoints(s.createdAt, p);
      solarPoints += p;
  });

  forestationData.forEach(f => {
      const p = 50 * (f.totalPlants || 1);
      addPoints(f.updatedAt || f.createdAt, p);
      plantationPoints += p;
  });

  const monthlyTokens = Object.keys(monthlyMap).map(key => ({
      month: key,
      tokens: monthlyMap[key]
  }));

  const activityBreakdown = [
      { name: 'Transport', value: transportPoints },
      { name: 'Electricity', value: electricPoints },
      { name: 'Solar', value: solarPoints },
      { name: 'Plantation', value: plantationPoints },
  ].filter(i => i.value > 0);

  if(activityBreakdown.length === 0) {
      activityBreakdown.push({ name: 'No Activity', value: 1 });
  }

  const monthlyElec = electricBills.filter(b => new Date(b.createdAt) >= firstDayOfMonth);
  const monthlyElecUnits = monthlyElec.reduce((sum, bill) => sum + bill.unitsUsed, 0);

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
    monthlyTokens,
    activityBreakdown,
    monthlyStats: {
      kmDriven: transportPoints,
      elecUnitsLogged: monthlyElecUnits,
    },
    vehicles: vehicles,
  };

  const totalSubmissions = vehicles.length + (solarData.length > 0 ? 1 : 0) + (forestationData.length > 0 ? 1 : 0) + electricBills.length;
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

  dashboardData.totalSubmissions = totalSubmissions;
  dashboardData.treesPlanted = treesPlanted;
  dashboardData.co2Saved = Math.round(treeSavings + solarSavings + evSavings);

  return res.status(200).json(new ApiResponse(200, dashboardData, "Dashboard data fetched successfully"));
});