import type { Request, Response, NextFunction } from "express";

export function clampNumber(
  raw: unknown,
  defaultValue: number,
  min: number,
  max: number,
): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return defaultValue;
  return Math.min(Math.max(n, min), max);
}

export function adminAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const expectedUser = process.env.ADMIN_USER;
  const expectedPass = process.env.ADMIN_PASS;

  if (!expectedUser || !expectedPass) {
    console.error("[admin] ADMIN_USER / ADMIN_PASS not set");
    res.status(500).send("Admin not configured");
    return;
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Aries Admin"');
    res.status(401).send("Auth required");
    return;
  }

  const base64 = header.split(" ")[1] ?? "";
  let decoded: string;
  try {
    decoded = Buffer.from(base64, "base64").toString("utf8");
  } catch {
    res.setHeader("WWW-Authenticate", 'Basic realm="Aries Admin"');
    res.status(401).send("Invalid auth");
    return;
  }

  const [user, pass] = decoded.split(":");
  if (user !== expectedUser || pass !== expectedPass) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Aries Admin"');
    res.status(401).send("Invalid credentials");
    return;
  }

  next();
}

// Tables réelles visibles
export const REAL_TABLES = new Set<string>([
  "players",
  "rooms",
  "player_state",
  "player_privacy",
  "player_relationships",
  "room_players",
  "blocked_ips",
  "rate_limit_usage",
  "direct_messages",
  "message_rate_limit_usage",
]);

// Sources virtuelles de stats basées sur rate_limit_usage
export const STATS_SOURCES = new Set<string>([
  "stats_requests_per_player",
  "stats_requests_per_day",
  "stats_requests_per_month",
]);
