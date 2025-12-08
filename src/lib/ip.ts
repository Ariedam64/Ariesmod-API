import type { Request } from "express";

export function getIp(req: Request): string | null {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length > 0) {
    return xf.split(",")[0].trim();
  }

  const ra = req.socket.remoteAddress;
  return ra ?? null;
}
