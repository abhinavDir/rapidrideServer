import Ride from "../models/ride.models.js";
import Vendor from "../models/vendor.models.js";
import { geocodeAddress } from "../utils/geocoder.js";

// Request a new Ride (User)
export const requestRide = async (req, res) => {
  try {
    const {
      userId,
      userName,
      userPhone,
      vehicleType,
      pickupAddress,
      dropoffAddress,
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
      fare,
      distanceKm,
    } = req.body;

    if (!pickupAddress || !dropoffAddress) {
      return res.status(400).json({
        success: false,
        message: "Pickup address and dropoff destination are required",
      });
    }

    // Auto-geocode pickup address if coordinates missing
    let pLat = Number(pickupLat);
    let pLng = Number(pickupLng);
    if (isNaN(pLat) || isNaN(pLng) || (pLat === 0 && pLng === 0)) {
      const geoP = await geocodeAddress(pickupAddress);
      pLat = geoP.latitude;
      pLng = geoP.longitude;
    }
    // Fallback if geocoding failed or returned 0
    if (!pLat || !pLng || isNaN(pLat) || isNaN(pLng) || (pLat === 0 && pLng === 0)) {
      pLat = 26.8467;
      pLng = 80.9462;
    }

    // Auto-geocode dropoff address if coordinates missing
    let dLat = Number(dropoffLat);
    let dLng = Number(dropoffLng);
    if (isNaN(dLat) || isNaN(dLng) || (dLat === 0 && dLng === 0)) {
      const geoD = await geocodeAddress(dropoffAddress);
      dLat = geoD.latitude;
      dLng = geoD.longitude;
    }
    // Fallback if geocoding failed or returned 0
    if (!dLat || !dLng || isNaN(dLat) || isNaN(dLng) || (dLat === 0 && dLng === 0)) {
      dLat = pLat + 0.02;
      dLng = pLng + 0.02;
    }

    // Max distance validation (100 KM limit)
    if (Number(distanceKm) > 100) {
      return res.status(400).json({
        success: false,
        message: "Ride distance cannot exceed 100 km. Please select a destination within 100 km.",
      });
    }

    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const ride = await Ride.create({
      userId: userId || null,
      userName: userName || "Passenger",
      userPhone: userPhone || "",
      vehicleType: vehicleType || "Bike",
      pickupAddress,
      pickupLocation: { type: "Point", coordinates: [pLng, pLat] },
      dropoffAddress,
      dropoffLocation: { type: "Point", coordinates: [dLng, dLat] },
      fare: Number(fare) || 120,
      distanceKm: Number(distanceKm) || 3.5,
      otp: generatedOtp,
      otpVerified: false,
      status: "PENDING",
    });

    res.status(201).json({
      success: true,
      message: `Ride request (${vehicleType || "Bike"}) created successfully. Searching for nearby riders...`,
      data: ride,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to request ride",
      error: error.message,
    });
  }
};

// Get all Pending Rides (Riders poll this to get fresh live incoming user requests)
export const getPendingRides = async (req, res) => {
  try {
    const { vehicleType, riderId } = req.query;
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Auto-expire/complete stale pending & accepted test rides created before 15 mins ago
    await Ride.updateMany(
      { status: { $in: ["PENDING", "ACCEPTED"] }, createdAt: { $lt: fifteenMinsAgo } },
      { $set: { status: "COMPLETED" } }
    );

    const pendingFilter = {
      status: "PENDING",
      createdAt: { $gte: fifteenMinsAgo },
    };

    let targetVehicleType = vehicleType;
    if (!targetVehicleType && riderId && riderId.length === 24) {
      try {
        const riderVendor = await Vendor.findById(riderId).select("vehicleType");
        if (riderVendor?.vehicleType) {
          targetVehicleType = riderVendor.vehicleType;
        }
      } catch (e) {}
    }

    if (targetVehicleType) {
      pendingFilter.vehicleType = new RegExp(`^${targetVehicleType}$`, "i");
    }

    const rides = await Ride.find(pendingFilter).sort({ createdAt: -1 });

    const activeRides = await Ride.find({
      status: { $in: ["ACCEPTED", "IN_PROGRESS"] },
      createdAt: { $gte: fifteenMinsAgo }
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: rides.length,
      data: rides,
      allRides: activeRides,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching pending rides",
      error: error.message,
    });
  }
};

// Atomic Ride Acceptance (First Rider to Click Wins)
export const acceptRide = async (req, res) => {
  try {
    const { rideId, riderId, vendorId, riderName, riderPhone, lat, lng } = req.body;
    const finalRiderId = riderId || vendorId || "64b000000000000000000001";

    if (!rideId) {
      return res.status(400).json({
        success: false,
        message: "Ride ID is required",
      });
    }

    // Atomic update: only succeeds if status is STILL "PENDING"
    const ride = await Ride.findOneAndUpdate(
      { _id: rideId, status: "PENDING" },
      {
        status: "ACCEPTED",
        assignedRiderId: finalRiderId,
        assignedRiderName: riderName || "Rider",
        assignedRiderPhone: riderPhone || "",
        riderLocation: {
          lat: Number(lat) || 0,
          lng: Number(lng) || 0,
        },
      },
      { returnDocument: 'after' }
    );

    if (!ride) {
      const existing = await Ride.findById(rideId);
      if (existing) {
        return res.status(200).json({
          success: true,
          message: "Ride already active.",
          data: existing,
        });
      }
      return res.status(200).json({
        success: false,
        message: "Ride request is no longer available.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ride accepted successfully! Head to pickup location.",
      data: ride,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error accepting ride",
      error: error.message,
    });
  }
};

// Start Ride (Rider verifies 4-Digit Pickup OTP -> heading to dropoff destination)
export const startRide = async (req, res) => {
  try {
    const { rideId, otp } = req.body;
    const existingRide = await Ride.findById(rideId);
    if (!existingRide) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    // Verify 4-Digit Pickup OTP
    if (existingRide.otp && String(otp || "").trim() !== String(existingRide.otp).trim()) {
      return res.status(400).json({
        success: false,
        message: "❌ Invalid 4-Digit Pickup OTP! Please ask the passenger for their correct 4-digit code.",
      });
    }

    existingRide.status = "IN_PROGRESS";
    existingRide.otpVerified = true;
    await existingRide.save();

    res.status(200).json({
      success: true,
      message: "🎉 OTP Verified! Journey started to destination Point B.",
      data: existingRide,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Rider Live Coordinates on active Ride
export const updateRideRiderLocation = async (req, res) => {
  try {
    let { rideId, lat, lng } = req.body;
    if (typeof rideId === "object" && rideId !== null) {
      lat = rideId.lat;
      lng = rideId.lng;
      rideId = rideId.rideId;
    }

    if (!rideId || String(rideId).trim() === "" || String(rideId) === "undefined") {
      return res.status(200).json({ success: false, message: "No active ride ID" });
    }

    const nLat = Number(lat) || 0;
    const nLng = Number(lng) || 0;

    const ride = await Ride.findByIdAndUpdate(
      rideId,
      {
        riderLocation: { lat: nLat, lng: nLng },
      },
      { returnDocument: 'after' }
    );
    res.status(200).json({ success: true, data: ride });
  } catch (error) {
    res.status(200).json({ success: false, message: error.message });
  }
};

// Get single ride status by ID (with latest rider position)
export const getRideStatus = async (req, res) => {
  try {
    let ride = await Ride.findById(req.params.id).lean();
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    // If ride.riderLocation is empty or (0,0), fallback to vendor's live database position
    const rLat = ride.riderLocation?.lat;
    const rLng = ride.riderLocation?.lng;
    if (!rLat || !rLng || (rLat === 0 && rLng === 0)) {
      if (ride.assignedRiderId) {
        const vendor = await Vendor.findById(ride.assignedRiderId).lean();
        if (vendor && vendor.location && vendor.location.coordinates) {
          const [vLng, vLat] = vendor.location.coordinates;
          if (vLat !== 0 || vLng !== 0) {
            ride.riderLocation = { lat: vLat, lng: vLng };
          }
        }
      }
    }

    res.status(200).json({ success: true, data: ride });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Complete Ride
export const completeRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    const ride = await Ride.findByIdAndUpdate(
      rideId,
      { status: "COMPLETED" },
      { returnDocument: 'after' }
    );
    res.status(200).json({ success: true, message: "Trip completed", data: ride });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Search Places Proxy (using Google Maps / Nominatim API)
export const searchPlace = async (req, res) => {
  try {
    const { q, lat, lng } = req.query;
    if (!q) {
      return res.status(200).json({ success: true, data: [] });
    }

    let userLat = parseFloat(lat);
    let userLng = parseFloat(lng);
    const hasLocation = !isNaN(userLat) && !isNaN(userLng);
    
    // helper to calculate distance
    const calcDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    let places = [];
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    // 1. Try Google Geocoding / Places if API Key available
    if (apiKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&components=country:in&language=en&key=${apiKey}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "OK" && data.results) {
            places = data.results.map((item) => ({
              title: item.address_components?.[0]?.long_name || item.formatted_address.split(",")[0],
              name: item.formatted_address,
              type: item.types ? item.types[0].replace(/_/g, " ").toUpperCase() : "PLACE",
              lat: parseFloat(item.geometry.location.lat),
              lng: parseFloat(item.geometry.location.lng),
            }));
          }
        }
      } catch (err) {
        console.error("Google Geocoding Proxy error, falling back:", err.message);
      }
    }

    // 2. Fetch from Photon (High coverage of small streets, colonies, shops, POIs)
    try {
      let photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lang=en&limit=20`;
      if (hasLocation) {
        photonUrl += `&lat=${userLat}&lon=${userLng}`;
      }
      const photonRes = await fetch(photonUrl);
      if (photonRes.ok) {
        const photonData = await photonRes.json();
        if (photonData.features && Array.isArray(photonData.features)) {
          photonData.features.forEach((item) => {
            const props = item.properties || {};
            const pName = props.name || props.street || props.district || props.city || "Place";
            const parts = [props.housenumber, props.street, props.district || props.suburb, props.city, props.state].filter(Boolean);
            const fullAddr = parts.length > 0 ? (props.name ? `${props.name}, ${parts.join(", ")}` : parts.join(", ")) : pName;
            
            places.push({
              title: pName,
              name: fullAddr,
              type: props.osm_value ? props.osm_value.replace(/_/g, " ").toUpperCase() : "LOCATION",
              lat: item.geometry.coordinates[1],
              lng: item.geometry.coordinates[0],
            });
          });
        }
      }
    } catch (e) {
      console.warn("Photon search error:", e.message);
    }

    // 3. Fetch from Nominatim for ultra-detailed street/colony/village/residential search
    try {
      let nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&countrycodes=in&limit=15&accept-language=en`;
      if (hasLocation) {
        nomUrl += `&viewbox=${userLng - 0.9},${userLat + 0.9},${userLng + 0.9},${userLat - 0.9}&bounded=0`;
      }
      const nomRes = await fetch(nomUrl, {
        headers: { "User-Agent": "RapidRideApp/1.0" },
      });
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (Array.isArray(nomData)) {
          nomData.forEach((item) => {
            const addr = item.address || {};
            const mainTitle = addr.road || addr.suburb || addr.neighbourhood || addr.residential || addr.colony || addr.village || addr.hamlet || addr.shop || addr.amenity || item.display_name.split(",")[0];
            places.push({
              title: mainTitle,
              name: item.display_name,
              type: (item.type || item.class || "STREET").replace(/_/g, " ").toUpperCase(),
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            });
          });
        }
      }
    } catch (e) {
      console.warn("Nominatim search error:", e.message);
    }

    // 4. Deduplicate and filter within 100 KM radius
    const uniqueMap = new Map();
    const filteredPlaces = [];

    for (const p of places) {
      if (isNaN(p.lat) || isNaN(p.lng)) continue;
      
      const dist = hasLocation ? calcDistance(userLat, userLng, p.lat, p.lng) : 0;
      if (hasLocation && dist > 100) continue; // Exclude > 100 km

      // Round coords to ~30m to deduplicate overlapping results
      const key = `${p.lat.toFixed(3)}_${p.lng.toFixed(3)}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, true);
        filteredPlaces.push({
          ...p,
          distKm: hasLocation ? dist : null,
        });
      }
    }

    // Sort by proximity to user
    if (hasLocation) {
      filteredPlaces.sort((a, b) => (a.distKm || 0) - (b.distKm || 0));
    }

    res.json({ success: true, data: filteredPlaces.slice(0, 20) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Multi-Route Directions Proxy (Google Directions API + OSRM fallback)
export const getDirections = async (req, res) => {
  try {
    const { originLat, originLng, destLat, destLng, mode = "driving" } = req.query;
    const oLat = parseFloat(originLat);
    const oLng = parseFloat(originLng);
    const dLat = parseFloat(destLat);
    const dLng = parseFloat(destLng);

    if (isNaN(oLat) || isNaN(oLng) || isNaN(dLat) || isNaN(dLng)) {
      return res.status(400).json({ success: false, message: "Invalid coordinates" });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const isBikeMode = mode === "bicycling" || mode === "bike";

    // 1. Try Google Directions API with vehicle-specific profile
    if (apiKey) {
      try {
        const googleMode = isBikeMode ? "bicycling" : "driving";
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${oLat},${oLng}&destination=${dLat},${dLng}&mode=${googleMode}&alternatives=true&key=${apiKey}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "OK" && data.routes && data.routes.length > 0) {
            return res.json({ success: true, data: data.routes, isGoogle: true, mode: googleMode });
          }
        }
      } catch (err) {
        console.error("Google Directions Proxy Error:", err.message);
      }
    }

    // 2. Fallback: Multi-Route OSRM Engine (Bike vs Car Profile)
    const profile = isBikeMode ? "cycling" : "driving";
    const allOsrmRoutes = [];

    // Route 1: Direct Vehicle-Specific Route
    try {
      const urlA = `https://router.project-osrm.org/route/v1/${profile}/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson&alternatives=true`;
      const resA = await fetch(urlA);
      if (resA.ok) {
        const dataA = await resA.json();
        if (dataA.code === "Ok" && dataA.routes) {
          dataA.routes.forEach((r) => allOsrmRoutes.push(r));
        }
      }
    } catch (e) {
      console.warn("OSRM Route A failed:", e.message);
    }

    // Route 2: Waypoint Alternative Route (sized for bike vs car)
    try {
      const midLat = (oLat + dLat) / 2;
      const midLng = (oLng + dLng) / 2;
      const dY = dLat - oLat;
      const dX = dLng - oLng;

      const offsetLat = midLat - dX * (isBikeMode ? 0.15 : 0.28);
      const offsetLng = midLng + dY * (isBikeMode ? 0.15 : 0.28);

      const urlB = `https://router.project-osrm.org/route/v1/${profile}/${oLng},${oLat};${offsetLng.toFixed(5)},${offsetLat.toFixed(5)};${dLng},${dLat}?overview=full&geometries=geojson`;
      const resB = await fetch(urlB);
      if (resB.ok) {
        const dataB = await resB.json();
        if (dataB.code === "Ok" && dataB.routes && dataB.routes.length > 0) {
          allOsrmRoutes.push(dataB.routes[0]);
        }
      }
    } catch (e) {
      console.warn("OSRM Route B failed:", e.message);
    }

    if (allOsrmRoutes.length > 0) {
      return res.json({ success: true, data: allOsrmRoutes, isOsrm: true, mode: profile });
    }

    res.json({ success: false, message: "No routes found" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel Ride (Only allowed when PENDING)
export const cancelRide = async (req, res) => {
  try {
    const { rideId, reason } = req.body;
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    if (ride.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel ride once rider has accepted the trip.",
      });
    }

    ride.status = "CANCELLED";
    ride.cancelReason = reason || "Cancelled by user";
    await ride.save();

    res.status(200).json({
      success: true,
      message: "Ride request cancelled successfully.",
      data: ride,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel ride",
      error: error.message,
    });
  }
};

// Get all User Rides (History, Booked, Completed, Cancelled) - Strictly per user
export const getUserRides = async (req, res) => {
  try {
    const { userId, phone } = req.query;
    const conditions = [];

    if (userId && userId !== "null" && userId !== "undefined" && userId.trim() !== "") {
      conditions.push({ userId: userId.trim() });
    }
    if (phone && phone !== "null" && phone !== "undefined" && phone.trim() !== "") {
      conditions.push({ userPhone: phone.trim() });
    }

    // Strict user scoping: If no user identifiers provided, return empty
    if (conditions.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const query = conditions.length === 1 ? conditions[0] : { $or: conditions };
    const rides = await Ride.find(query).sort({ createdAt: -1 }).limit(100);

    res.status(200).json({
      success: true,
      count: rides.length,
      data: rides,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user ride activity",
      error: error.message,
    });
  }
};

// Rate a completed Ride (User)
export const rateRide = async (req, res) => {
  try {
    const { rideId, rating, feedback } = req.body;
    if (!rideId || !rating) {
      return res.status(400).json({ success: false, message: "Ride ID and rating (1-5) are required" });
    }

    const nRating = Math.max(1, Math.min(5, Number(rating)));
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    ride.rating = nRating;
    ride.feedback = feedback || "";
    await ride.save();

    // If assigned rider exists, update vendor rating and total reviews
    let vendorRating = nRating;
    let vendorTotalReviews = 1;
    if (ride.assignedRiderId) {
      const vendor = await Vendor.findById(ride.assignedRiderId);
      if (vendor) {
        const currentReviews = vendor.totalReviews || 0;
        const currentRating = vendor.rating || 5.0;
        const newTotal = currentReviews + 1;
        const updatedAvg = Math.round(((currentRating * currentReviews + nRating) / newTotal) * 100) / 100;
        vendor.rating = updatedAvg;
        vendor.totalReviews = newTotal;
        await vendor.save();
        vendorRating = vendor.rating;
        vendorTotalReviews = vendor.totalReviews;
      }
    }

    res.status(200).json({
      success: true,
      message: "Rating recorded successfully",
      data: {
        rideId: ride._id,
        rating: ride.rating,
        feedback: ride.feedback,
        vendorRating,
        vendorTotalReviews,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit rating",
      error: error.message,
    });
  }
};

export default {
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
};
