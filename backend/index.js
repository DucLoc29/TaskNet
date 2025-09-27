// index.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import mongoose from "mongoose";
import passport from "passport";

import taskRoutes from "./routes/taskRoutes.js";
import googleAuthRoutes from "./routes/auth/google.js";

dotenv.config();

const app = express();

// Tin cậy proxy (Render/Heroku) để Passport/Express hiểu đúng https/host
app.set("trust proxy", 1);

// ===== CORS (allow local + domain FE trên Vercel qua ENV) =====
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
const allowedOrigins = new Set([FRONTEND_URL, "http://localhost:5173"]);

app.use(
  cors({
    origin(origin, cb) {
      // Cho phép tools/healthcheck không gửi Origin
      if (!origin) return cb(null, true);
      return allowedOrigins.has(origin)
        ? cb(null, true)
        : cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.options('*', cors());

// ===== Middlewares =====
app.use(express.json());
app.use(morgan("dev"));
app.use(passport.initialize());

// ===== Config & DB =====
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/tasknet";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error(" MongoDB connection error:", err));

// ===== Healthcheck =====
app.get("/api/health", (_req, res) => res.status(200).json({ ok: true }));

// ===== Routes =====
app.use("/api", taskRoutes);
app.use("/api/auth", googleAuthRoutes);

// Root
app.get("/", (_req, res) => {
  res.send("TaskNest API is running");
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log("FRONTEND_URL:", FRONTEND_URL);
});
