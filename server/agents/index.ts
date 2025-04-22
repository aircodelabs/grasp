import { Agent } from "@mastra/core/agent";
import { anthropic } from "@ai-sdk/anthropic";

export const myAgent = new Agent({
  name: "My Agent",
  instructions: "You are a helpful assistant.",
  model: anthropic("claude-3-7-sonnet-20250219"),
});

async function run() {
  const response = await myAgent.generate([
    { role: "user", content: "Hello, how can you assist me today?" },
  ]);
  console.log(response);
}

run();
