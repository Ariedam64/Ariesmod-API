import type { Application } from "express";
import { registerPublicRoomsApiRoute } from "./rooms-api";
import { registerPublicRoomsPageRoute } from "./rooms-page";

export function registerPublicRoutes(app: Application): void {
  registerPublicRoomsApiRoute(app);
  registerPublicRoomsPageRoute(app);
}
