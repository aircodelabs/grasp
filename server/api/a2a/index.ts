import express from "express";
import cors from "cors";
import { AgentCard } from "./schema";

const a2aRouter = express.Router();
a2aRouter.use(cors());

const agentCard: AgentCard = {
  name: "Grasp Browser Using",
  description:
    "Executes a high-level task using a browser, based on a natural language description. This agent interprets the intent, performs all necessary browser actions to complete the task, and returns the result of the interaction.",
  url: "http://localhost:3000/api/a2a",
  version: "0.0.1",
  capabilities: {},
  skills: [
    {
      id: "browser-use",
      name: "Browser Use Tool",
      description: "Operates a browser to complete the given task.",
      tags: ["browser", "research", "web-scraping"],
      examples: [
        "Search for AirBnB accommodations in San Francisco for April 21-25, 2025",
      ],
    },
  ],
};

export { agentCard, a2aRouter };
