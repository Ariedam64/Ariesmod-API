import type { Application } from "express";
import { registerFriendRemoveRoute } from "./friend-remove";
import { registerFriendRequestRoute } from "./friend-request";
import { registerFriendRespondRoute } from "./friend-respond";
import { registerListFriendRequestsRoute } from "./list-friend-requests";
import { registerListFriendsRoute } from "./list-friends";

export function registerFriendsRoutes(app: Application): void {
  registerFriendRemoveRoute(app);
  registerFriendRequestRoute(app);
  registerFriendRespondRoute(app);
  registerListFriendRequestsRoute(app);
  registerListFriendsRoute(app);
}
