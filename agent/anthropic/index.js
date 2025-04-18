import Anthropic from "@anthropic-ai/sdk";
import browserUse from "./browser-use.js";
import browserNavigate from "./browser-navigate.js";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error("Missing ANTHROPIC_API_KEY in environment");
}

const anthropic = new Anthropic({
  apiKey,
});

export async function handle(task, browser, onNewMessage) {
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

  const messages = [
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

  console.log("messages", messages);

  const result = await loop(system, tools, messages, onNewMessage);
  return result;
}

async function loop(system, tools, messages, onNewMessage) {
  console.log("loop");
  // Remove all images of the tool_result except the last one
  let foundedImage = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== "user") {
      continue;
    }
    const isToolResult =
      Array.isArray(message.content) &&
      message.content.some((block) => block.type === "tool_result");
    if (!isToolResult) {
      continue;
    }
    if (foundedImage < 1) {
      foundedImage += 1;
      continue;
    }
    message.content = message.content.map((block) => {
      if (block.type === "tool_result") {
        block.content = block.content.filter((sb) => sb.type !== "image");
      }
      return block;
    });
  }
  console.log("messages", messages);

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
  const toolResults = [];
  for (const block of content) {
    if (block.type === "text") {
      console.log("Message");
      console.log(block);
    } else if (block.type === "tool_use") {
      const { id, name, input } = block;
      console.log("Tool use:", name);
      console.log(input);
      const tool = tools.find((tool) => tool.definition.name === name);
      if (tool) {
        const { text, images } = await tool.handle(input);
        const toolResultContent = [];
        if (text) {
          toolResultContent.push({
            type: "text",
            text,
          });
        }
        if (images.length > 0) {
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
