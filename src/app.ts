import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { registerCollectStateRoutes } from "./routes/collect";
import { registerRoomsRoutes } from "./routes/rooms"
import { registerFriendsRoutes } from "./routes/friends";       
import { registerPlayersRoutes } from "./routes/players";
import { registerAdminRoutes } from "./routes/admin";    
import { registerMessagesRoutes } from "./routes/messages";

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

registerCollectStateRoutes(app);
registerRoomsRoutes(app);
registerFriendsRoutes(app);
registerPlayersRoutes(app);
registerMessagesRoutes(app);
registerAdminRoutes(app);
