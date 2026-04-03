import { Router } from "express";
import { getUserDashboard, getLeaderboard, updateWalletAddress } from "../controllers/user.controller.js";
import { updateUserProfile } from "../controllers/profile.controller.js"; 
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
const router = Router();

router.use(authMiddleware);

// Route to get all dashboard data
router.route("/dashboard").get(getUserDashboard);

// Route for leaderboard
router.route("/leaderboard").get(getLeaderboard);

// Route for updating the profile
router.route("/profile").patch(updateUserProfile);

router.patch("/update-wallet", ClerkExpressRequireAuth(), updateWalletAddress);

export default router;