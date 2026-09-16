import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.models.js";
import Ride from "../models/ride.models.js";

const googleClient = new OAuth2Client(
  process.env.GOOGLE_WEB_CLIENT_ID ||
    "1086278321257-9dfr0j336ccqkn4j77qe10a7rifsfuoh.apps.googleusercontent.com"
);

export const RegisterUser = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please fill all required fields" });
    }

    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashPassword,
      phone,
      address,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ success: true, message: "User created successfully", user: userResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const LoginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", { expiresIn: "1d" });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ success: true, message: "Login successful", user: userResponse, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Google OAuth — auto-creates account on first sign-in, logs in returning users
export const googleAuthUser = async (req, res) => {
  try {
    const { googleId, email, name, picture } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ success: false, message: "Google auth data missing" });
    }

    // Find existing user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Link Google account if not already linked
      if (!user.googleId) user.googleId = googleId;
      if (picture && !user.picture) user.picture = picture;
      await user.save();
    } else {
      // First time — create account automatically (no password needed)
      user = await User.create({
        name,
        email,
        googleId,
        picture,
        password: await bcrypt.hash(googleId + email + Date.now(), 10),
        authProvider: "google",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ success: true, message: "Google login successful", user: userResponse, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId, name, phone, address, workAddress, emergencyContact, walletBalance, latitude, longitude } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Please provide userId" });
    }

    const updateData = {};
    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: "Name cannot be empty" });
      }
      updateData.name = trimmedName;
    }
    if (phone !== undefined) updateData.phone = String(phone).trim();
    if (address !== undefined) updateData.address = String(address).trim();
    if (workAddress !== undefined) updateData.workAddress = String(workAddress).trim();
    if (emergencyContact !== undefined) updateData.emergencyContact = String(emergencyContact).trim();
    if (walletBalance !== undefined) updateData.walletBalance = Number(walletBalance);
    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = { type: "Point", coordinates: [Number(longitude), Number(latitude)] };
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { returnDocument: 'after' });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userResponse = user.toObject();
    delete userResponse.password;
    res.json({ success: true, message: "User updated successfully", user: userResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Build real user query filter
    const userConditions = [{ userId: user._id }];
    if (user.phone) {
      userConditions.push({ userPhone: user.phone }, { phone: user.phone });
    }

    const [rideCount, distanceAgg, totalRidesCount] = await Promise.all([
      Ride.countDocuments({
        $or: userConditions,
        status: "COMPLETED",
      }),
      Ride.aggregate([
        {
          $match: {
            $or: userConditions,
            status: "COMPLETED",
          },
        },
        { $group: { _id: null, total: { $sum: "$distanceKm" } } },
      ]),
      Ride.countDocuments({
        $or: userConditions,
      }),
    ]);

    const realDistKm = distanceAgg[0]?.total ? parseFloat(Number(distanceAgg[0].total).toFixed(1)) : 0;
    const realCo2Saved = parseFloat((realDistKm * 0.14).toFixed(1));
    const realCoins = rideCount * 25;

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user,
      stats: {
        rides: rideCount,
        totalTrips: totalRidesCount,
        distanceKm: realDistKm,
        co2SavedKg: realCo2Saved,
        rapidCoins: realCoins,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { updateUser, getUser, RegisterUser, LoginUser, googleAuthUser };
