import express from "express";
import {
  registerVendor,
  loginVendor,
  updateVendorLocation,
  createVendor,
  searchVendor,
  getNearbyVendors,
  deleteVendorAccount,
} from "../controllers/vendor.js";

const router = express.Router();

router.post("/register-vendor", registerVendor);
router.post("/login-vendor", loginVendor);
router.post("/update-location", updateVendorLocation);
router.post("/create-vendor", createVendor);
router.get("/search-vendor", searchVendor);
router.get("/nearby", getNearbyVendors);
router.post("/delete-account", deleteVendorAccount);
router.delete("/delete-account", deleteVendorAccount);

export default router;
