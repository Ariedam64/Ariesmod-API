import type { Application } from "express";
import { registerAdminPageRoutes } from "./page";
import { registerAdminTableRoutes } from "./table";
import { registerAdminSqlAndToolsRoutes } from "./sql";
import { registerAdminOverviewRoutes } from "./overview";
import { registerAdminDetailRoutes } from "./detail";

export function registerAdminRoutes(app: Application): void {
  registerAdminPageRoutes(app);
  registerAdminOverviewRoutes(app);
  registerAdminTableRoutes(app);
  registerAdminSqlAndToolsRoutes(app);
  registerAdminDetailRoutes(app);
}
