import express from "express";
import {
  requestRide,
  getPendingRides,
  acceptRide,
  startRide,
  updateRideRiderLocation,
  getRideStatus,
  completeRide,
  searchPlace,
  getDirections,
  cancelRide,
  getUserRides,
  rateRide,
} from "../controllers/ride.js";

const router = express.Router();

router.post("/request", requestRide);
router.post("/book", requestRide);
router.get("/pending", getPendingRides);
router.post("/accept", acceptRide);
router.post("/start", startRide);
router.post("/update-location", updateRideRiderLocation);
router.get("/status/:id", getRideStatus);
router.post("/complete", completeRide);
router.get("/search-place", searchPlace);
router.get("/directions", getDirections);
router.post("/cancel", cancelRide);
router.post("/cancel/:id", (req, res) => {
  req.body = { ...req.body, rideId: req.params.id };
  return cancelRide(req, res);
});
router.get("/user-rides", getUserRides);
router.post("/rate", rateRide);
router.post("/rate/:id", (req, res) => {
  req.body = { ...req.body, rideId: req.params.id };
  return rateRide(req, res);
});

export default router;
