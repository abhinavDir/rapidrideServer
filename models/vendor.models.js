import mongoose from "mongoose";

const VendorSchema = new mongoose.Schema(
  {
    // Owner Details
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },

    // Shop Details
    shopName: {
      type: String,
      required: true,
      trim: true,
    },

    vehicleType: {
      type: String,
      enum: ["Bike", "Car", "Auto"],
      default: "Bike",
    },

    vehicleModel: {
      type: String,
      default: "Royal Enfield Hunter 350",
    },

    vehicleNumber: {
      type: String,
      default: "UP 32 BK 4821",
    },

    upiId: {
      type: String,
      default: "",
    },

    emergencyPhone: {
      type: String,
      default: "",
    },

    bloodGroup: {
      type: String,
      default: "B+",
    },

    // Rider Custom Pricing
    perKmRate: {
      type: Number,
      default: 12, // ₹ per kilometer
    },

    baseFare: {
      type: Number,
      default: 25, // ₹ base fare
    },

    shopImage: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      default: "",
    },

    // Login
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      default: "",
    },

    // Address
    address: {
      type: String,
      required: true,
    },

    landmark: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "",
    },

    pincode: {
      type: String,
      default: "",
    },

    placeId: {
      type: String,
      default: "",
    },

    // GeoJSON
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    // Shop Status
    isOpen: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    deliveryRadius: {
      type: Number,
      default: 5000, // meters
    },

    rating: {
      type: Number,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

VendorSchema.index({ location: "2dsphere" });

export default mongoose.model("Vendor", VendorSchema);