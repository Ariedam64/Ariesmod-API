import type { Application } from "express";
import { registerGroupCreateRoute } from "./group-create";
import { registerGroupDeleteRoute } from "./group-delete";
import { registerGroupDetailRoute } from "./group-detail";
import { registerGroupLeaveRoute } from "./group-leave";
import { registerGroupListRoute } from "./group-list";
import { registerGroupListPublicRoute } from "./group-list-public";
import { registerGroupMemberAddRoute } from "./group-member-add";
import { registerGroupMemberRemoveRoute } from "./group-member-remove";
import { registerGroupMessageListRoute } from "./group-message-list";
import { registerGroupMessageReadRoute } from "./group-message-read";
import { registerGroupMessageSendRoute } from "./group-message-send";
import { registerGroupJoinRoute } from "./group-join";
import { registerGroupRenameRoute } from "./group-rename";
import { registerGroupRoleRoute } from "./group-role";

export function registerGroupsRoutes(app: Application): void {
  registerGroupCreateRoute(app);
  registerGroupListRoute(app);
  registerGroupListPublicRoute(app);
  registerGroupDetailRoute(app);
  registerGroupRenameRoute(app);
  registerGroupDeleteRoute(app);
  registerGroupMemberAddRoute(app);
  registerGroupMemberRemoveRoute(app);
  registerGroupLeaveRoute(app);
  registerGroupJoinRoute(app);
  registerGroupRoleRoute(app);
  registerGroupMessageSendRoute(app);
  registerGroupMessageListRoute(app);
  registerGroupMessageReadRoute(app);
}
