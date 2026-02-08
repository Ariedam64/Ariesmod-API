import type { Application } from "express";
import { registerFriendCancelRoute } from "./friend-cancel";
import { registerFriendRemoveRoute } from "./friend-remove";
import { registerFriendRequestRoute } from "./friend-request";
import { registerFriendRespondRoute } from "./friend-respond";
import { registerListFriendRequestsRoute } from "./list-friend-requests";
import { registerListFriendsRoute } from "./list-friends";
import { registerFriendRequestsStreamRoute } from "./requests-stream";

export function registerFriendsRoutes(app: Application): void {
  registerFriendCancelRoute(app);
  registerFriendRemoveRoute(app);
  registerFriendRequestRoute(app);
  registerFriendRespondRoute(app);
  registerListFriendRequestsRoute(app);
  registerListFriendsRoute(app);
  registerFriendRequestsStreamRoute(app);
}
