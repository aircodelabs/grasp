import { Browser } from "../../browser/index";
import { AnthropicToolDefinition, Tool } from "./types";

const definition: AnthropicToolDefinition = {
  name: "batch_tool",
  description: "Invoke multiple other tool calls simultaneously",
  input_schema: {
    type: "object",
    properties: {
      invocations: {
        type: "array",
        description: "The tool calls to invoke",
        items: {
          types: "object",
          properties: {
            name: {
              types: "string",
              description: "The name of the tool to invoke",
            },
            args: {
              types: "string",
              description: "The arguments to the tool",
            },
          },
          required: ["name", "arguments"],
        },
      },
    },
    required: ["invocations"],
  },
};

function createHandler(browser: Browser, otherTools: Tool[]) {
  return async ({
    invocations,
  }: {
    invocations: { name: string; args: string }[];
  }) => {
    const textResults = [];
    for (const invocation of invocations) {
      const tool = otherTools.find((tool) => tool.name === invocation.name);
      if (!tool) {
        throw new Error(`Tool ${invocation.name} not found`);
      }
      const { text } = await tool.handle(invocation.args);
      textResults.push(text);
    }

    const screenshot = await browser.screenshot();

    return {
      text: textResults.join("\n"),
      images: [screenshot],
    };
  };
}

export default function createTool(browser: Browser, otherTools: Tool[]): Tool {
  return {
    name: "batch_tool",
    definition,
    handle: createHandler(browser, otherTools),
  };
}
