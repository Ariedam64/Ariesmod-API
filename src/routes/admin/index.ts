import type { Application } from "express";
import { registerAdminPageRoutes } from "./page";
import { registerAdminTableRoutes } from "./table";
import { registerAdminSqlAndToolsRoutes } from "./sql";

export function registerAdminRoutes(app: Application): void {
  registerAdminPageRoutes(app);
  registerAdminTableRoutes(app);
  registerAdminSqlAndToolsRoutes(app);
}
