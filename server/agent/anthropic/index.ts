import Anthropic from "@anthropic-ai/sdk";
import browserUse from "./browser-use";
import browserNavigate from "./browser-navigate";
import { Browser } from "@server/browser/index";
import { AnthropicMessage, ToolExecutionResult } from "./types";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error("Missing ANTHROPIC_API_KEY in environment");
}

const anthropic = new Anthropic({
  apiKey,
});

export async function handle(
  task: string,
  browser: Browser,
  onNewMessage: (message: AnthropicMessage) => void
) {
  const system = `You are utilizing a Chrome browser environment. You can only use the Chrome browser to perform actions.
You can use the computer tool to interact with the page.
You should use browser_navigate tool to navigate the browser.
If you see nothing, try going to bing.com.
If you scroll and nothing changes, it means you have already reached the bottom or top of this window, do not continue scrolling.
The current date is ${new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })}.
To reduce cost, previous screenshot images have been removed from the conversation. Only the recent screenshot is included.`;

  const messages: AnthropicMessage[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: task,
        },
      ],
    },
  ];

  const tools = [browserUse(browser), browserNavigate(browser)];

  const result = await loop(system, tools, messages, onNewMessage);
  return result;
}

async function loop(
  system: string,
  tools: any[],
  messages: AnthropicMessage[],
  onNewMessage: (message: AnthropicMessage) => void
) {
  // Remove all images of the tool_result except the last one
  let foundedImage = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== "user") {
      continue;
    }
    if (!Array.isArray(message.content)) {
      continue;
    }
    const isToolResult = message.content.some(
      (block) => block.type === "tool_result"
    );
    if (!isToolResult) {
      continue;
    }
    if (foundedImage < 1) {
      foundedImage += 1;
      continue;
    }
    message.content = message.content.map((block) => {
      if (block.type === "tool_result" && Array.isArray(block.content)) {
        block.content = block.content.filter((sb) => sb.type !== "image");
      }
      return block;
    });
  }

  const response = await anthropic.beta.messages.create({
    model: "claude-3-7-sonnet-20250219",
    max_tokens: 8192,
    tools: tools.map((tool) => tool.definition),
    system: system,
    messages,
    betas: ["computer-use-2025-01-24"],
    thinking: { type: "enabled", budget_tokens: 1024 },
  });
  // Add it to the message history
  const content = response.content;
  messages.push({
    role: "assistant",
    content,
  });
  onNewMessage({
    role: "assistant",
    content,
  });

  // Check if any tools were used
  const toolResults: Anthropic.Beta.Messages.BetaToolResultBlockParam[] = [];
  for (const block of content) {
    if (block.type === "text") {
    } else if (block.type === "tool_use") {
      const { id, name, input } = block;
      const tool = tools.find((tool) => tool.definition.name === name);
      if (tool) {
        const { text, images } = (await tool.handle(
          input
        )) as ToolExecutionResult;
        const toolResultContent: (
          | Anthropic.Beta.Messages.BetaTextBlockParam
          | Anthropic.Beta.Messages.BetaImageBlockParam
        )[] = [];
        if (text) {
          toolResultContent.push({
            type: "text",
            text,
          });
        }
        if (images && images.length > 0) {
          for (const image of images) {
            toolResultContent.push({
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: image,
              },
            });
          }
        }
        toolResults.push({
          type: "tool_result",
          tool_use_id: id,
          content: toolResultContent,
        });
      }
    }
  }

  // If no tools were used, return the content
  if (toolResults.length === 0) {
    return content;
  }

  messages.push({
    role: "user",
    content: toolResults,
  });
  onNewMessage({
    role: "user",
    content: toolResults,
  });

  return loop(system, tools, messages, onNewMessage);
}
