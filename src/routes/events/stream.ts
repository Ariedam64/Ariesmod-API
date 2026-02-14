import type { Application, Request, Response } from "express";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { isPlayerConnected, normalizeId } from "../messages/common";
import {
  addUnifiedStream,
  getLastEventId,
} from "./hub";
import { buildWelcomeData } from "./welcome";
import { requireApiKey } from "../../middleware/auth";

function parseLastEventId(req: Request): number {
  const headerValue = req.headers["last-event-id"];
  const raw =
    Array.isArray(headerValue) && headerValue.length > 0
      ? headerValue[0]
      : typeof headerValue === "string"
        ? headerValue
        : null;

  const queryRaw = normalizeId(req.query.since);
  const candidate = raw ?? (queryRaw ? queryRaw : "0");
  const id = Number(candidate);
  return Number.isFinite(id) && id > 0 ? Math.floor(id) : 0;
}

export function registerUnifiedStreamRoute(app: Application): void {
  app.get("/events/stream", requireApiKey, async (req: Request, res: Response) => {
    const ip = getIp(req);
    const playerId = req.authenticatedPlayerId!;

    try {
      const allowed = await checkRateLimit(ip, playerId, 480, 480);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("events stream rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    try {
      const connected = await isPlayerConnected(playerId);
      if (!connected) {
        return res.status(403).send("Player not connected");
      }
    } catch (err) {
      console.error("events stream connected check error:", err);
      return res.status(500).send("DB error");
    }

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    const rawRes = res as any;
    if (typeof rawRes.flushHeaders === "function") {
      rawRes.flushHeaders();
    }
    req.socket.setTimeout(0);

    // Force an immediate chunk so proxies flush headers
    res.write(":ok\n\n");

    const lastEventId = parseLastEventId(req);
    const lastKnown = getLastEventId(playerId);
    res.write(
      `event: connected\ndata: ${JSON.stringify({
        playerId,
        lastEventId: lastKnown,
      })}\n\n`,
    );

    // Send welcome event with all initial data
    try {
      const welcomeData = await buildWelcomeData(playerId);
      res.write(
        `event: welcome\ndata: ${JSON.stringify(welcomeData)}\n\n`,
      );
    } catch (err) {
      console.error("events stream welcome data error:", err);
      // Continue even if welcome data fails
    }

    // SSE doesn't send backlog - welcome event contains current state
    // Real-time events will be streamed as they occur
    addUnifiedStream(playerId, res);
  });
}
