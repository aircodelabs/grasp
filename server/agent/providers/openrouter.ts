import BasicAgent from "../basic.js";
import type { Browser } from "../../browser/index.js";
import axios, { AxiosInstance } from "axios";
import { BasicMessage, ToolExecutionResult } from "../../utils/types.js";
import createBrowserNavigateTool from "../tools/browser-navigate.js";
import createAnthropicComputerTool from "../tools/anthropic-computer.js";
import { ZodObject } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

export default class OpenRouterAgent extends BasicAgent {
  private openrouterModel: string = "anthropic/claude-3.7-sonnet";
  private openrouterClient: AxiosInstance;
  protected tools: any[];
  protected toolsExecutors: Record<
    string,
    (input: any) => Promise<ToolExecutionResult>
  >;
  protected messages: any[];

  constructor(browser: Browser) {
    super(browser);

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("Missing OPENROUTER_API_KEY.");
    }

    this.openrouterClient = axios.create({
      baseURL: "https://openrouter.ai/api/v1",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://github.com/aircodelabs/grasp",
        "X-Title": "Grasp",
      },
    });

    this.tools = [];
    this.toolsExecutors = {};

    const browserNavigate = createBrowserNavigateTool(browser);
    this.tools.push({
      type: "function",
      function: {
        name: browserNavigate.name,
        description: browserNavigate.description,
        parameters: this.getToolSchema(browserNavigate.parameters),
      },
    });
    this.toolsExecutors[browserNavigate.name] = browserNavigate.execute;

    const computerTool = createAnthropicComputerTool(browser);
    this.tools.push({
      type: "computer_20250124",
      name: "computer",
      display_width_px: computerTool.display_width_px,
      display_height_px: computerTool.display_height_px,
    });
    this.toolsExecutors["computer"] = computerTool.execute;

    this.messages = [];
  }

  // @override
  async handle(task: string) {
    this.messages = [
      {
        role: "system",
        content: this.system,
      },
      {
        role: "user",
        content: task,
      },
    ];

    const result = await this.loop();
    return result;
  }

  // @override
  protected async loop(): Promise<string> {
    const data = await this.generate();
    const responseMessage = data.choices[0].message;

    this.messages.push(responseMessage);

    // Dispatch the message to the listener
    if (this.newMessageListener) {
      const message: BasicMessage = {
        role: "assistant",
        content: [],
      };
      if (responseMessage.content !== null) {
        if (typeof responseMessage.content === "string") {
          message.content.push({
            type: "text",
            text: responseMessage.content,
          });
        } else {
          for (const part of responseMessage.content) {
            if (part.type === "text") {
              message.content.push({
                type: "text",
                text: part.text,
              });
            }
          }
        }
      }
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        for (const toolCall of responseMessage.tool_calls) {
          message.content.push({
            type: "tool_call",
            toolCallId: toolCall.id,
            toolName: toolCall.function.name,
            args: toolCall.function.arguments,
          });
        }
      }

      this.newMessageListener(message);
    }

    const toolResultMessages: any[] = [];
    if (responseMessage.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        const tool = this.toolsExecutors[toolName];

        if (!tool) {
          throw new Error(`Tool ${toolName} not found`);
        }

        const { text, image } = await tool(toolArgs);

        const resultContent = [];

        if (text) {
          resultContent.push({
            type: "text",
            text,
          });
        }

        if (image) {
          resultContent.push({
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${image}`,
            },
          });
        }

        toolResultMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: toolName,
          content: resultContent,
        });
      }
    }

    if (toolResultMessages.length === 0) {
      if (typeof responseMessage.content === "string") {
        return responseMessage.content;
      }
      return responseMessage.content
        .filter((part: any) => part.type === "text")
        .map((part: any) => part.text)
        .join("\n");
    }

    if (this.newMessageListener) {
      const message: BasicMessage = {
        role: "tool",
        content: toolResultMessages.map(
          ({ tool_call_id, name, content }: any) => {
            return {
              type: "tool_result",
              toolCallId: tool_call_id,
              content: content.map((part: any) => {
                if (part.type === "text") {
                  return {
                    type: "text",
                    text: part.text,
                  };
                } else if (part.type === "image_url") {
                  return {
                    type: "image",
                    dataType: "base64",
                    data: part.image_url.url.split(",")[1],
                    mimeType: "image/png",
                  };
                }
              }),
            };
          }
        ),
      };

      this.newMessageListener(message);
    }

    this.filterLastResult();

    for (const toolResultMessage of toolResultMessages) {
      this.messages.push(toolResultMessage);
    }

    return this.loop();
  }

  // @override
  protected async generate() {
    console.log("start generating");
    const response = await this.openrouterClient.post("/chat/completions", {
      model: this.openrouterModel,
      max_tokens: 8192,
      tools: this.tools,
      messages: this.messages,
      betas: ["computer-use-2025-01-24"],
    });
    if (response.data.error) {
      console.log("Error", response.data.error);
    } else {
      console.log("Generated", response.data.choices[0].message);
    }
    return response.data;
  }

  private filterLastResult() {
    const toolMessages = this.messages.filter((m) => m.role === "tool");
    if (toolMessages.length === 0) {
      return;
    }

    const lastToolMessage = toolMessages[toolMessages.length - 1];

    if (lastToolMessage) {
      const content = lastToolMessage.content;
      if (!content || typeof content === "string") {
        return;
      }
      lastToolMessage.content = content.filter(
        (part: any) => part.type !== "image_url"
      );
    }
  }

  private getToolSchema(parameters: ZodObject<any>) {
    const jsonSchema = zodToJsonSchema(parameters);
    delete jsonSchema["$schema"];
    return jsonSchema;
  }
}
