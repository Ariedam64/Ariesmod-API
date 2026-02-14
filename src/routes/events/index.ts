import type { Application } from "express";
import { registerUnifiedPollRoute } from "./poll";
import { registerUnifiedStreamRoute } from "./stream";

export function registerEventsRoutes(app: Application): void {
  registerUnifiedStreamRoute(app);
  registerUnifiedPollRoute(app);
}
