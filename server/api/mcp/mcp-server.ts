import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { operate } from "../services/operate.js";

const mcpServer = new McpServer({
  name: "browser-using-server",
  version: "0.0.1",
});

mcpServer.tool(
  "operate-browser",
  "Executes a high-level task using a browser, based on a natural language description. The tool interprets the intent, performs all necessary browser actions to complete the task, and returns the result of the interaction.",
  {
    task: z.string(),
  },
  async ({ task }: { task: string }) => {
    const result = await operate(task);
    console.log("result", result);
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  }
);

export default mcpServer;
