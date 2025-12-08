import type { Application } from "express";
import { registerPlayerViewRoute } from "./player-view";
import { registerPlayersViewRoute } from "./players-view";

export function registerPlayersRoutes(app: Application): void {
  registerPlayerViewRoute(app);
  registerPlayersViewRoute(app);
}
