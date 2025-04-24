import "dotenv/config";

import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { router as webRouter, ioRegister as webIoRegister } from "./web/api.js";
import frontendRegister from "./web/frontend.js";
import mcpRouter from "./mcp/index.js";
import { agentCard, a2aRouter } from "./a2a/index.js";
import morgan from "morgan";
const app = express();
const server = createServer(app);
const io = new Server(server);

// Apply some common middleware
app.use(morgan("tiny"));
app.use(express.json());

// Host the agent card under well-known
app.get("/.well-known/agent.json", (req, res) => {
  res.json(agentCard);
});

// Register each server
app.use("/api/web", webRouter);
webIoRegister(io.of("/web"));

app.use("/api/mcp", mcpRouter);
app.use("/api/a2a", a2aRouter);

// Serve frontend. this must be the last routing middleware
if (process.env.NODE_ENV === "production") {
  frontendRegister(app);
}

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
);

// Graceful shutdown
function shutdown(reason = "") {
  console.log(`Shutting down server... ${reason}`);
  io.close();
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  shutdown("unhandledRejection");
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
