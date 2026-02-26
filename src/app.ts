import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { registerCollectStateRoutes } from "./routes/collect";
import { registerRoomsRoutes } from "./routes/rooms"
import { registerFriendsRoutes } from "./routes/friends";
import { registerPlayersRoutes } from "./routes/players";
import { registerAdminRoutes } from "./routes/admin";
import { registerMessagesRoutes } from "./routes/messages";
import { registerGroupsRoutes } from "./routes/groups";
import { registerLeaderboardRoutes } from "./routes/leaderboard";
import { registerEventsRoutes } from "./routes/events";
import { registerDiscordAuthRoutes } from "./routes/auth";
import { registerPrivacyRoutes } from "./routes/privacy";
import { registerPublicRoutes } from "./routes/public";

dotenv.config();

export const app = express();

const defaultOrigins = [
  "https://magicgarden.gg",
  "https://magiccircle.gg",
  "https://starweaver.org",
  "https://preview.magicgarden.gg",
  "https://1227719606223765687.discordsays.com",
  "https://discord.com",
];
const rawOrigins = (process.env.CORS_ORIGINS || defaultOrigins.join(","))
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const allowedOrigins = new Set(rawOrigins);
const wildcardHosts = [
  ".magiccircle.workers.dev",
];

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.has(origin)) return true;
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return wildcardHosts.some((suffix) => host.endsWith(suffix));
  } catch {
    return false;
  }
}

const corsOptions: cors.CorsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    return cb(null, isAllowedOrigin(origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  maxAge: 600,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

// Log all incoming requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

registerDiscordAuthRoutes(app);
registerCollectStateRoutes(app);
registerRoomsRoutes(app);
registerFriendsRoutes(app);
registerPlayersRoutes(app);
registerMessagesRoutes(app);
registerGroupsRoutes(app);
registerLeaderboardRoutes(app);
registerEventsRoutes(app);
registerPrivacyRoutes(app);
registerPublicRoutes(app);
registerAdminRoutes(app);
