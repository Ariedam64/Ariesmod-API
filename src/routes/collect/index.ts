import type { Application } from "express";
import { registerCollectStateRoute } from "./collectState";

export function registerCollectStateRoutes(app: Application): void {
  registerCollectStateRoute(app);
}
