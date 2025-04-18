/**
 * This is the API for the web app
 */
import express from "express";
import { operate } from "../services/operate.js";
import { getBrowser } from "../../browser/index.js";
import {
  registerLogListener,
  unregisterLogListener,
} from "../../utils/logs.js";

/** HTTP API */
export const router = express.Router();
router.post("/operate", async (req, res) => {
  const { task } = req.body;
  const response = await operate(task);
  res.json(response);
});

router.post("/test-browser", async (req, res) => {
  const browser = await getBrowser();
  const { action, args } = req.body;
  console.log(action, args);
  Array.isArray(args)
    ? await browser[action](...args)
    : await browser[action](args);
  res.json({ result: "ok" });
});

/** WebSocket API */
export const ioRegister = (namespace) => {
  namespace.on("connection", async (socket) => {
    console.log("a user connected");
    const browser = await getBrowser();

    // Send screenshot every 200ms
    const screenshotInterval = setInterval(async () => {
      const base64 = await browser.screenshot();
      const screenshot = `data:image/png;base64,${base64}`;

      socket.emit("screenshot", screenshot);
    }, 200);

    const logListener = (log) => {
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
