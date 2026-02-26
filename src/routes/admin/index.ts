import type { Application } from "express";
import { registerAdminPageRoutes } from "./page";
import { registerAdminTableRoutes } from "./table";
import { registerAdminSqlAndToolsRoutes } from "./sql";
import { registerAdminOverviewRoutes } from "./overview";
import { registerAdminDetailRoutes } from "./detail";
import { registerAdminRoomsRoutes } from "./rooms";
import { registerAdminGroupsRoutes } from "./groups";
import { registerAdminLeaderboardRoutes } from "./leaderboard";
import { registerAdminBadgesRoutes } from "./badges";
import { registerAdminBroadcastRoutes } from "./broadcast";

export function registerAdminRoutes(app: Application): void {
  registerAdminPageRoutes(app);
  registerAdminOverviewRoutes(app);
  registerAdminTableRoutes(app);
  registerAdminSqlAndToolsRoutes(app);
  registerAdminDetailRoutes(app);
  registerAdminRoomsRoutes(app);
  registerAdminGroupsRoutes(app);
  registerAdminLeaderboardRoutes(app);
  registerAdminBadgesRoutes(app);
  registerAdminBroadcastRoutes(app);
}
