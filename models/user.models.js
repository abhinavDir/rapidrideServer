import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    workAddress: {
      type: String,
    },
    emergencyContact: {
      type: String,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    // Google OAuth fields
    googleId: {
      type: String,
      sparse: true,
    },
    picture: {
      type: String,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ location: "2dsphere" });
UserSchema.index({ googleId: 1 }, { sparse: true });

const User = mongoose.model("User", UserSchema);
export default User;
