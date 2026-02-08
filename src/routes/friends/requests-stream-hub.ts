import type { Response } from "express";

type StreamConnection = {
  res: Response;
};

const streams = new Map<string, Set<StreamConnection>>();
const HEARTBEAT_MS = 30000;
let heartbeatTimer: NodeJS.Timeout | null = null;

function removeConnection(playerId: string, conn: StreamConnection): void {
  const set = streams.get(playerId);
  if (!set) return;
  set.delete(conn);
  if (set.size === 0) {
    streams.delete(playerId);
  }
}

function startHeartbeat(): void {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    for (const [playerId, set] of streams) {
      for (const conn of set) {
        try {
          conn.res.write("event: ping\ndata: {}\n\n");
        } catch (err) {
          removeConnection(playerId, conn);
        }
      }
    }
    if (streams.size === 0 && heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }, HEARTBEAT_MS);
}

export function addRequestStream(playerId: string, res: Response): void {
  const conn: StreamConnection = { res };
  const set = streams.get(playerId) ?? new Set<StreamConnection>();
  set.add(conn);
  streams.set(playerId, set);
  startHeartbeat();

  res.on("close", () => {
    removeConnection(playerId, conn);
    if (streams.size === 0 && heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  });
}

export function pushRequestEvent(
  playerId: string,
  event: string,
  payload: Record<string, any>,
): void {
  const set = streams.get(playerId);
  if (!set || set.size === 0) return;
  const data = JSON.stringify(payload);

  for (const conn of set) {
    try {
      conn.res.write(`event: ${event}\ndata: ${data}\n\n`);
    } catch (err) {
      removeConnection(playerId, conn);
    }
  }
}
