import OpenAI from "openai";
import BasicAgent from "../basic.js";
import type { Browser } from "../../browser/index.js";
import createBrowserNavigateTool from "../tools/browser-navigate.js";
import createOpenaiComputerTool from "../tools/openai-computer.js";
import createFillinCredentialsTool from "../tools/fillin-credentials.js";
import type { BasicMessage, ToolExecutionResult } from "../../utils/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ZodObject } from "zod";

type OpenAITool = OpenAI.Responses.Tool;

export default class OpenAIAgent extends BasicAgent {
  private openaiModel: "computer-use-preview" = "computer-use-preview";
  private openaiClient: OpenAI;
  protected tools: OpenAITool[];
  protected toolsExecutors: Record<
    string,
    (input: any) => Promise<ToolExecutionResult>
  >;
  protected input: OpenAI.Responses.ResponseInput;
  protected previousResponse?: OpenAI.Responses.Response;

  constructor(browser: Browser) {
    super(browser);
    this.openaiClient = new OpenAI();

    this.tools = [];
    this.toolsExecutors = {};

    // Computer use tool
    const computerTool = createOpenaiComputerTool(browser);
    this.tools.push({
      type: "computer_use_preview" as "computer-preview",
      display_width: computerTool.display_width,
      display_height: computerTool.display_height,
      environment: "browser",
    });
    this.toolsExecutors["computer"] = computerTool.execute;

    // Standard tools
    const toolCreators = [
      createBrowserNavigateTool,
      createFillinCredentialsTool,
    ];
    for (const toolCreator of toolCreators) {
      const tool = toolCreator(browser);
      this.tools.push({
        type: "function",
        name: tool.name,
        description: tool.description,
        strict: true,
        parameters: this.getToolSchema(tool.parameters),
      });
      this.toolsExecutors[tool.name] = tool.execute;
    }

    this.input = [];
  }

  // @override
  async handle(task: string) {
    this.input = [
      {
        role: "system",
        content: this.system,
      },
      {
        role: "developer",
        content:
          "Use the browser_navigate functions to navigate the browser. If you see nothing, try going to bing.com.",
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: task,
          },
        ],
      },
    ];

    const result = await this.loop();
    return result;
  }

  // @override
  protected async loop(): Promise<string> {
    const response = await this.generate();
    const output = response.output;

    if (this.newMessageListener) {
      const message: BasicMessage = {
        role: "assistant",
        content: [],
      };

      for (const item of output) {
        if (item.type === "message") {
          for (const part of item.content) {
            if (part.type === "output_text") {
              message.content.push({
                type: "text",
                text: part.text,
              });
            }
          }
        } else if (item.type === "computer_call") {
          message.content.push({
            type: "tool_call",
            toolCallId: item.call_id,
            toolName: "computer",
            args: JSON.stringify(item.action),
          });
        } else if (item.type === "function_call") {
          message.content.push({
            type: "tool_call",
            toolCallId: item.call_id,
            toolName: item.name,
            args: item.arguments,
          });
        }
      }

      this.newMessageListener(message);
    }

    const nextInput: OpenAI.Responses.ResponseInput = [];

    for (const item of output) {
      if (item.type === "computer_call") {
        const {
          call_id: callId,
          action,
          pending_safety_checks: pendingSafetyChecks,
        } = item;

        if (pendingSafetyChecks.length > 0) {
          // TODO: handle pending safety checks
        }

        // TODO: Execute the action
        const computerToolExecutor = this.toolsExecutors["computer"];
        const { image } = await computerToolExecutor(action);

        nextInput.push({
          type: "computer_call_output",
          call_id: callId,
          output: {
            type: "computer_screenshot",
            image_url: `data:image/png;base64,${image}`,
          },
        });
      } else if (item.type === "function_call") {
        const { name, arguments: args, call_id: callId } = item;
        const toolExecutor = this.toolsExecutors[name];
        if (!toolExecutor) {
          throw new Error(`Tool ${name} not found`);
        }
        const { text, image } = await toolExecutor(JSON.parse(args));

        nextInput.push({
          type: "function_call_output",
          call_id: callId,
          output: text ?? "",
        });

        if (image) {
          // We use user role to send the image since openai function call does not support image output right now
          nextInput.push({
            type: "message",
            role: "user",
            content: [
              {
                type: "input_image",
                image_url: `data:image/png;base64,${image}`,
                detail: "auto",
              },
            ],
          });
        }
      }
    }

    // If no tools were used, return the content
    if (nextInput.length === 0) {
      let result = output
        .filter((item) => item.type === "message")
        .map((item) =>
          item.content
            .filter((part) => part.type === "output_text")
            .map((part) => part.text)
            .join("\n")
        )
        .join("\n");
      return result;
    }

    // Else, go to the next loop
    // First, dispatch the tool results to the listener
    if (this.newMessageListener) {
      const message: BasicMessage = {
        role: "tool",
        content: [],
      };

      for (const item of nextInput) {
        if (item.type === "computer_call_output") {
          message.content.push({
            type: "tool_result",
            toolCallId: item.call_id,
            content: [
              {
                type: "image",
                dataType: "base64",
                data: item.output.image_url ?? "",
                mimeType: "image/png",
              },
            ],
          });
        } else if (item.type === "function_call_output") {
          message.content.push({
            type: "tool_result",
            toolCallId: item.call_id,
            content: [
              {
                type: "text",
                text: item.output,
              },
            ],
          });
        }
      }

      this.newMessageListener(message);
    }

    this.previousResponse = response;
    this.input = nextInput;
    return this.loop();
  }

  protected async generate(): Promise<OpenAI.Responses.Response> {
    return this.openaiClient.responses.create({
      model: this.openaiModel,
      previous_response_id: this.previousResponse
        ? this.previousResponse.id
        : undefined,
      tools: this.tools,
      input: this.input,
      reasoning: {
        generate_summary: "concise",
      },
      truncation: "auto",
    });
  }

  private getToolSchema(
    parameters: ZodObject<any>
  ): OpenAI.Responses.FunctionTool["parameters"] {
    const jsonSchema = zodToJsonSchema(parameters, {
      target: "openAi",
    });
    delete jsonSchema["$schema"];
    return jsonSchema;
  }
}
