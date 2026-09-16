import rateLimit from "express-rate-limit";

// 1. General API Limiter (Protects server from overall traffic flooding)
export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests from this IP. Please wait a few moments before trying again to protect application stability.",
      retryAfterMinutes: 15,
    });
  },
});

// 2. Strict Authentication Limiter (Protects against brute force and credential stuffing)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // Limit each IP to 25 authentication attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many login or registration attempts. Please wait 15 minutes before trying again to safeguard account security.",
      retryAfterMinutes: 15,
    });
  },
});

// 3. High-Frequency Live Updates Limiter (Protects GPS tracking and ride dispatch endpoints)
export const telemetryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit to 60 requests per minute (1 per second)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "High-frequency request limit reached. Rate throttling active to ensure server stability.",
      retryAfterSeconds: 60,
    });
  },
});
