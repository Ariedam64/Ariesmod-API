import type { Application } from "express";
import { registerPlayerViewRoute } from "./player-view";
import { registerPlayersViewRoute } from "./players-view";
import { registerListModPlayersRoute } from "./list-mod-players";

export function registerPlayersRoutes(app: Application): void {
  registerPlayerViewRoute(app);
  registerPlayersViewRoute(app);
  registerListModPlayersRoute(app);
}
