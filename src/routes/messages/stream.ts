import type { Application, Request, Response } from "express";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { isPlayerConnected, normalizeId } from "./common";
import { addStream } from "./streamHub";

export function registerMessagesStreamRoute(app: Application): void {
  app.get("/messages/stream", async (req: Request, res: Response) => {
    const ip = getIp(req);
    const playerId = normalizeId(req.query.playerId);

    if (!playerId || playerId.length < 3) {
      return res.status(400).send("Invalid playerId");
    }

    try {
      const allowed = await checkRateLimit(ip, playerId, 240, 240);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("messages stream rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    let connected = false;
    try {
      connected = await isPlayerConnected(playerId);
    } catch (err) {
      console.error("messages stream connected check error:", err);
      return res.status(500).send("DB error");
    }

    if (!connected) {
      return res.status(403).send("Player not connected");
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    const rawRes = res as any;
    if (typeof rawRes.flushHeaders === "function") {
      rawRes.flushHeaders();
    }
    req.socket.setTimeout(0);

    res.write(`event: connected\ndata: ${JSON.stringify({ playerId })}\n\n`);
    addStream(playerId, res);
  });
}
