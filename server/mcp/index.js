import express from "express";
import sseRouter from "./sse.js";

const mcpRouter = express.Router();
mcpRouter.use(sseRouter);

export default mcpRouter;
