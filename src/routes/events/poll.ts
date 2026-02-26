import type { Application, Request, Response } from "express";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { isPlayerConnected, normalizeId } from "../messages/common";
import {
  getEventsSince,
  getLastEventId,
  getServerSessionId,
  waitForEvents,
} from "./hub";
import { requireApiKey } from "../../middleware/auth";
import { buildWelcomeData } from "./welcome";

function parseSinceId(req: Request): number {
  const raw = normalizeId(req.query.since);
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? Math.floor(id) : 0;
}

function parseTimeoutMs(req: Request): number {
  const raw = normalizeId(req.query.timeoutMs);
  const value = Number(raw);
  if (!Number.isFinite(value)) return 25000;
  return Math.min(30000, Math.max(5000, Math.floor(value)));
}

export function registerUnifiedPollRoute(app: Application): void {
  app.get("/events/poll", requireApiKey, async (req: Request, res: Response) => {
    const ip = getIp(req);
    const playerId = req.authenticatedPlayerId!;

    try {
      const allowed = await checkRateLimit(ip, playerId, 480, 480);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("events poll rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    try {
      const connected = await isPlayerConnected(playerId);
      if (!connected) {
        return res.status(403).send("Player not connected");
      }
    } catch (err) {
      console.error("events poll connected check error:", err);
      return res.status(500).send("DB error");
    }

    const sinceId = parseSinceId(req);

    // Send connected and welcome events on first connection (since=0)
    if (sinceId === 0) {
      try {
        const rawLastEventId = getLastEventId(playerId);
        const lastEventId = Math.max(rawLastEventId, 1);
        const serverSessionId = getServerSessionId();
        const welcomeData = await buildWelcomeData(playerId);
        const now = new Date().toISOString();

        return res.status(200).json({
          playerId,
          lastEventId,
          serverSessionId,
          events: [
            {
              id: 0,
              type: "connected",
              data: {
                playerId,
                lastEventId,
                serverSessionId,
              },
              ts: now,
            },
            {
              id: 0,
              type: "welcome",
              data: welcomeData,
              ts: now,
            },
          ],
        });
      } catch (err) {
        console.error("events poll welcome data error:", err);
        return res.status(500).send("DB error (welcome data)");
      }
    }

    const immediate = getEventsSince(playerId, sinceId);
    if (immediate.length > 0) {
      return res.status(200).json({
        playerId,
        lastEventId: getLastEventId(playerId),
        serverSessionId: getServerSessionId(),
        events: immediate,
      });
    }

    const timeoutMs = parseTimeoutMs(req);
    const handle = waitForEvents(playerId, sinceId, timeoutMs);
    let closed = false;
    req.on("close", () => {
      closed = true;
      handle.cancel();
    });

    const result = await handle.promise;
    if (closed) return;
    return res.status(200).json({
      playerId,
      lastEventId: result.lastEventId,
      serverSessionId: getServerSessionId(),
      events: result.events,
    });
  });
}
