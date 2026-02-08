import type { Response } from "express";

type StreamConnection = {
  res: Response;
  heartbeat: NodeJS.Timeout;
};

const streams = new Map<string, Set<StreamConnection>>();

function removeConnection(playerId: string, conn: StreamConnection): void {
  const set = streams.get(playerId);
  if (!set) return;
  set.delete(conn);
  if (set.size === 0) {
    streams.delete(playerId);
  }
}

export function addStream(playerId: string, res: Response): void {
  const heartbeat = setInterval(() => {
    try {
      res.write("event: ping\ndata: {}\n\n");
    } catch (err) {
      clearInterval(heartbeat);
    }
  }, 30000);

  const conn: StreamConnection = { res, heartbeat };
  const set = streams.get(playerId) ?? new Set<StreamConnection>();
  set.add(conn);
  streams.set(playerId, set);

  res.on("close", () => {
    clearInterval(heartbeat);
    removeConnection(playerId, conn);
  });
}

export function pushEvent(
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
      clearInterval(conn.heartbeat);
      removeConnection(playerId, conn);
    }
  }
}
