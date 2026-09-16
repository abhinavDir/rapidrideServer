import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import MongooseConnect from "./config/db.js";
import vendorRoutes from "./routes/vendor.routes.js";
import UserRouter from "./routes/user.routes.js";
import rideRoutes from "./routes/ride.routes.js";

dotenv.config();
dotenv.config({ path: "./server/.env" });
const app = express();

app.use(cors());
app.use(express.json());
MongooseConnect();

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/api/vendor", vendorRoutes);
app.use("/api/rider", vendorRoutes);
app.use("/api/user", UserRouter);
app.use("/api/ride", rideRoutes);
app.use("/api/rides", rideRoutes);

app.use("/public", express.static(path.join(__dirname, "public")));

// Direct Wireless APK Download Routes for phones
app.get("/download/user", (req, res) => {
  const apkPath = path.resolve(__dirname, "../RapidRide-Latest.apk");
  res.download(apkPath, "RapidRide-User.apk");
});

app.get(["/download/rider", "/download/captain"], (req, res) => {
  const apkPath = path.resolve(__dirname, "../RapidRide-Captain.apk");
  res.download(apkPath, "RapidRide-Captain.apk");
});

app.get(["/download", "/apps"], (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Download RapidRide Apps</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0A0F1D; color: #FFFFFF; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #131D31; max-width: 440px; width: 100%; border-radius: 28px; padding: 32px 24px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 48px rgba(0,0,0,0.6); text-align: center; }
    .header-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(99, 102, 241, 0.15); color: #818CF8; padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 700; margin-bottom: 16px; border: 1px solid rgba(99, 102, 241, 0.3); }
    h1 { font-size: 26px; font-weight: 900; margin-bottom: 8px; letter-spacing: -0.5px; }
    p { color: #94A3B8; font-size: 14px; margin-bottom: 28px; line-height: 1.5; }
    
    .app-card { display: flex; align-items: center; background: #1C2740; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 16px; margin-bottom: 16px; text-decoration: none; text-align: left; transition: all 0.2s ease; }
    .app-card:active { transform: scale(0.98); }
    .app-card:hover { border-color: rgba(99, 102, 241, 0.5); background: #223050; }
    .app-icon { width: 64px; height: 64px; border-radius: 16px; object-fit: cover; box-shadow: 0 6px 16px rgba(0,0,0,0.4); flex-shrink: 0; }
    .app-info { margin-left: 16px; flex: 1; }
    .app-title { font-size: 16px; font-weight: 800; color: #FFFFFF; margin-bottom: 2px; }
    .app-sub { font-size: 12px; color: #94A3B8; margin-bottom: 6px; }
    .app-tag { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
    .tag-user { background: rgba(14, 165, 233, 0.2); color: #38BDF8; }
    .tag-captain { background: rgba(245, 158, 11, 0.2); color: #FBBF24; }
    .dl-btn { background: #3B82F6; color: #FFF; font-size: 13px; font-weight: 800; padding: 8px 14px; border-radius: 10px; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px rgba(59,130,246,0.3); }
    .dl-btn-gold { background: #F59E0B; color: #000; box-shadow: 0 4px 10px rgba(245,158,11,0.3); }
    
    .info { font-size: 12px; color: #64748B; margin-top: 20px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header-badge">⚡ Standalone Wireless Distribution</div>
    <h1>RapidRide Apps</h1>
    <p>Tap below to download and install either app directly on your Android phone:</p>

    <!-- Passenger App -->
    <a href="/download/user" class="app-card">
      <img src="/public/user_icon.png" class="app-icon" alt="Passenger App Icon" />
      <div class="app-info">
        <div class="app-title">RapidRide</div>
        <div class="app-sub">Passenger Mobile App</div>
        <span class="app-tag tag-user">For Riders</span>
      </div>
      <div class="dl-btn">📥 APK</div>
    </a>

    <!-- Captain App -->
    <a href="/download/captain" class="app-card">
      <img src="/public/captain_icon.png" class="app-icon" alt="Captain App Icon" />
      <div class="app-info">
        <div class="app-title">RapidRide Captain</div>
        <div class="app-sub">Driver Partner App</div>
        <span class="app-tag tag-captain">For Drivers</span>
      </div>
      <div class="dl-btn dl-btn-gold">📥 APK</div>
    </a>

    <div class="info">
      ✓ Custom High-Res Icons Included<br/>
      ✓ Direct WiFi/LAN Download (No USB Required)
    </div>
  </div>
</body>
</html>
  `);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});