/**
 * This is the API for the web app
 */
import express from "express";
import { Namespace } from "socket.io";
import { operate } from "../services/operate";
import { getScreenshot } from "../services/browser";
import {
  registerLogListener,
  unregisterLogListener,
  LogListener,
} from "../../utils/logs";

/** HTTP API */
export const router = express.Router();
router.post("/operate", async (req, res) => {
  const { task } = req.body;
  const response = await operate(task);
  res.json(response);
});

/** WebSocket API */
export const ioRegister = (namespace: Namespace) => {
  namespace.on("connection", async (socket) => {
    console.log("a user connected");

    // Send screenshot every 200ms
    const screenshotInterval = setInterval(async () => {
      const base64 = await getScreenshot();
      const screenshot = `data:image/png;base64,${base64}`;

      socket.emit("screenshot", screenshot);
    }, 200);

    const logListener: LogListener = (log) => {
      socket.emit("log", log);
    };
    registerLogListener(logListener);

    socket.on("disconnect", () => {
      clearInterval(screenshotInterval);
      unregisterLogListener(logListener);
      console.log("user disconnected");
    });
  });
};
