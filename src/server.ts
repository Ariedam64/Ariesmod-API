import http from "http";
import { WebSocketServer } from "ws";
import { app } from "./app";

const PORT = Number(process.env.PORT || 4000);

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: "/ws/ping" });

wss.on("connection", (socket) => {
  socket.send("ready");

  socket.on("message", (data) => {
    const msg = data.toString();
    if (msg === "ping") {
      socket.send("pong");
      return;
    }
    socket.send(`echo:${msg}`);
  });
});

server.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
  console.log(`WS listening on ws://localhost:${PORT}/ws/ping`);
});
