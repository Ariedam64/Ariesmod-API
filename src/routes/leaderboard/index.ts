import type { Application } from "express";
import { registerLeaderboardCoinsRoute } from "./coins";
import { registerLeaderboardCoinsRankRoute } from "./coins-rank";
import { registerLeaderboardEggsRoute } from "./eggs-hatched";
import { registerLeaderboardEggsRankRoute } from "./eggs-rank";

export function registerLeaderboardRoutes(app: Application): void {
  registerLeaderboardCoinsRoute(app);
  registerLeaderboardCoinsRankRoute(app);
  registerLeaderboardEggsRoute(app);
  registerLeaderboardEggsRankRoute(app);
}
