import OpenAI from "openai";
import browserNavigate from "./browser-navigate.js";
import browserUse from "./browser-use.js";

const openai = new OpenAI({
  apiKey: "",
});

export async function handle(task, browser) {
  const screenshot = await browser.screenshot();
  const input = [
    {
      role: "developer",
      content:
        "Use the browser_navigate functions to navigate the browser. If you see nothing, try going to google.com.",
    },
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: task,
        },
        {
          type: "input_image",
          image_url: `data:image/png;base64,${screenshot}`,
        },
      ],
    },
  ];
  const tools = [browserUse(browser), browserNavigate(browser)];

  const response = await loop(input, tools);
  return response;
}

async function loop(input, tools, previousResponse) {
  const response = await openai.responses.create({
    model: "computer-use-preview",
    previous_response_id: previousResponse ? previousResponse.id : undefined,
    tools: tools.map((tool) => tool.definition),
    input,
    reasoning: {
      generate_summary: "concise",
    },
    truncation: "auto",
  });

  const nextInput = [];

  const output = response.output;

  for (const item of output) {
    if (item.type === "message") {
      // Log outout for test
      console.log("Message");
      console.log(JSON.stringify(item, null, 2));
    } else if (item.type === "reasoning") {
      // TODO: handle reasoning, Log it out for test now
      console.log("Reasoning");
      console.log(JSON.stringify(item, null, 2));
    } else if (item.type === "computer_call") {
      const {
        call_id: callId,
        action,
        pending_safety_checks: pendingSafetyChecks,
      } = item;

      if (pendingSafetyChecks.length > 0) {
        // TODO: handle pending safety checks
      }

      // TODO: Execute the action
      const browserUseTool = tools.find((tool) => tool.name === "browser_use");
      const { text, image } = await browserUseTool.handle(action);

      nextInput.push({
        type: "computer_call_output",
        call_id: callId,
        output: {
          type: "input_image",
          image_url: `data:image/png;base64,${image}`,
          current_url: text,
        },
      });
    } else if (item.type === "function_call") {
      const { name, arguments: args, call_id: callId } = item;
      const tool = tools.find((tool) => tool.name === name);
      if (!tool) {
        throw new Error(`Tool ${name} not found`);
      }
      const { text, image } = await tool.handle(JSON.parse(args));

      nextInput.push({
        type: "function_call_output",
        call_id: callId,
        output: text,
      });
      if (image) {
        // We use user role to send the image since openai function call does not support image output right now
        nextInput.push({
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: `data:image/png;base64,${image}`,
            },
          ],
        });
      }
    }
  }

  if (nextInput.length === 0) {
    return response;
  }

  return loop(nextInput, tools, response);
}
