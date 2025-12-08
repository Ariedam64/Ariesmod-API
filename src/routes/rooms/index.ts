import type { Application } from "express";
import { registerRoomsRoute } from "./rooms";

export function registerRoomsRoutes(app: Application): void {
  registerRoomsRoute(app);
}
