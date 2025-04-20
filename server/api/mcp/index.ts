import express from "express";
import cors from "cors";
import sseRouter from "./sse";

const mcpRouter = express.Router();

// router.use(
//   cors({
//     origin: ["http://localhost:6274", "http://127.0.0.1:6274"],
//   })
// );
mcpRouter.use(cors());

mcpRouter.use(sseRouter);

export default mcpRouter;
