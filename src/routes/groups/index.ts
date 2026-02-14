import type { Application } from "express";
import { registerGroupCreateRoute } from "./group-create";
import { registerGroupDeleteRoute } from "./group-delete";
import { registerGroupDetailRoute } from "./group-detail";
import { registerGroupLeaveRoute } from "./group-leave";
import { registerGroupListRoute } from "./group-list";
import { registerGroupMemberAddRoute } from "./group-member-add";
import { registerGroupMemberRemoveRoute } from "./group-member-remove";
import { registerGroupMessageListRoute } from "./group-message-list";
import { registerGroupMessageReadRoute } from "./group-message-read";
import { registerGroupMessageSendRoute } from "./group-message-send";
import { registerGroupRenameRoute } from "./group-rename";

export function registerGroupsRoutes(app: Application): void {
  registerGroupCreateRoute(app);
  registerGroupListRoute(app);
  registerGroupDetailRoute(app);
  registerGroupRenameRoute(app);
  registerGroupDeleteRoute(app);
  registerGroupMemberAddRoute(app);
  registerGroupMemberRemoveRoute(app);
  registerGroupLeaveRoute(app);
  registerGroupMessageSendRoute(app);
  registerGroupMessageListRoute(app);
  registerGroupMessageReadRoute(app);
}
