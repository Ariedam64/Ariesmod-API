import type { Application } from "express";
import { registerMessagesReadRoute } from "./read";
import { registerMessagesPollRoute } from "./poll";
import { registerMessagesSendRoute } from "./send";
import { registerMessagesThreadRoute } from "./thread";

export function registerMessagesRoutes(app: Application): void {
  registerMessagesSendRoute(app);
  registerMessagesThreadRoute(app);
  registerMessagesReadRoute(app);
  registerMessagesPollRoute(app);
}
