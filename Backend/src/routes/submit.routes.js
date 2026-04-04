import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

import { logElectricityBill } from "../controllers/electricity.controller.js";
import { logSolarGeneration } from "../controllers/solar.controller.js";
import { handleTransportForm } from "../controllers/vehicle.controller.js"; // ✅ CHANGED HERE
import { logGreenPurchase } from "../controllers/purchase.controller.js";
import { logPlanting } from "../controllers/plantation.controller.js";

const router = Router();
router.use(authMiddleware);

// Backend controllers
router.route("/electricity").post(upload.single("billImage"), logElectricityBill); 
router.route("/solar").post(upload.single("bill"), logSolarGeneration); 
router.route("/transport").post(handleTransportForm); // ✅ CHANGED HERE
router.route("/purchase").post(logGreenPurchase); 
router.route("/plantation").post(upload.single("plantImage"), logPlanting); 

export default router;