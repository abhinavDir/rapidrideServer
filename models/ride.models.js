import mongoose from "mongoose";

const RideSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userName: {
      type: String,
      default: "Passenger",
    },
    userPhone: {
      type: String,
      default: "",
    },

    // Vehicle Type requested by customer: "Bike", "Car", or "Auto"
    vehicleType: {
      type: String,
      enum: ["Bike", "Car", "Auto"],
      default: "Bike",
    },

    // Pickup Location
    pickupAddress: {
      type: String,
      required: true,
    },
    pickupLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0],
      },
    },

    // Dropoff / Destination Location
    dropoffAddress: {
      type: String,
      required: true,
    },
    dropoffLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0],
      },
    },

    fare: {
      type: Number,
      default: 0,
    },
    distanceKm: {
      type: Number,
      default: 0,
    },

    // Status: PENDING | ACCEPTED | IN_PROGRESS | COMPLETED | CANCELLED
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },

    // Assigned Rider / Driver
    assignedRiderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },
    assignedRiderName: {
      type: String,
      default: "",
    },
    assignedRiderPhone: {
      type: String,
      default: "",
    },

    // Real-time live coordinates of the rider during active ride
    riderLocation: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },

    // 4-Digit Security Pickup OTP Verification
    otp: {
      type: String,
      default: "",
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },

    // Passenger Rating & Feedback for Driver
    rating: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

RideSchema.index({ pickupLocation: "2dsphere" });

export default mongoose.model("Ride", RideSchema);
