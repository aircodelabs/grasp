import express from "express";
import cors from "cors";
import mcpServer from "./mcp-server.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const router = express.Router();
// router.use(
//   cors({
//     origin: ["http://localhost:6274", "http://127.0.0.1:6274"],
//   })
// );
router.use(cors());

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports = {};

router.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/api/mcp/messages", res);
  transports[transport.sessionId] = transport;
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  await mcpServer.connect(transport);
});

router.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];
  if (transport) {
    try {
      await transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      console.error("Error handling post message", error);
      res.status(500).send("Error handling post message");
    }
  } else {
    console.log("No transport found for sessionId", sessionId);
    res.status(400).send("No transport found for sessionId");
  }
});

export default router;
