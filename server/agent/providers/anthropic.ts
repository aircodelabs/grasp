import BasicAgent from "../basic.js";
import type { Browser } from "../../browser/index.js";
import Anthropic from "@anthropic-ai/sdk";
import createBrowserNavigateTool from "../tools/browser-navigate.js";
import createAnthropicComputerTool from "../tools/anthropic-computer.js";
import createFillinCredentialsTool from "../tools/fillin-credentials.js";
import zodToJsonSchema from "zod-to-json-schema";
import { ZodObject } from "zod";
import type {
  BasicMessage,
  TextContentPart,
  ImageContentPart,
  ToolExecutionResult,
} from "../../utils/types.js";

export type AnthropicMessage = Anthropic.Beta.Messages.BetaMessageParam;
export type AnthropicTool = Anthropic.Beta.Messages.BetaToolUnion;

export default class AnthropicAgent extends BasicAgent {
  private anthropicModel: string;
  private anthropicClient: Anthropic;
  protected tools: AnthropicTool[];
  protected toolsExecutors: Record<
    string,
    (input: any) => Promise<ToolExecutionResult>
  >;
  protected messages: AnthropicMessage[];

  constructor(browser: Browser) {
    super(browser);
    this.anthropicModel = "claude-3-7-sonnet-20250219";
    this.anthropicClient = new Anthropic();

    this.tools = [];
    this.toolsExecutors = {};

    // Computer use tool
    const computerTool = createAnthropicComputerTool(browser);
    this.tools.push({
      name: "computer",
      type: "computer_20250124",
      display_width_px: computerTool.display_width_px,
      display_height_px: computerTool.display_height_px,
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
        name: tool.name,
        description: tool.description,
        input_schema: this.getToolSchema(tool.parameters),
      });
      this.toolsExecutors[tool.name] = tool.execute;
    }

    this.messages = [];
  }

  // @override
  async handle(task: string) {
    this.messages = [
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
    const result = await this.loop();
    return result;
  }

  // @override
  protected async loop(): Promise<string> {
    const response = await this.generate();

    const content = response.content;
    this.messages.push({
      role: "assistant",
      content: content,
    });

    // Dispatch the message to the listener
    if (this.newMessageListener) {
      const message: BasicMessage = {
        role: "assistant",
        content: [],
      };
      for (const part of content) {
        if (part.type === "text") {
          message.content.push({
            type: "text",
            text: part.text,
          });
        } else if (part.type === "tool_use") {
          message.content.push({
            type: "tool_call",
            toolCallId: part.id,
            toolName: part.name,
            args: JSON.stringify(part.input),
          });
        }
      }
      this.newMessageListener(message);
    }

    const toolResults = await this.checkAndCallTools(content);

    // If no tools were used, return the content
    if (toolResults.length === 0) {
      let result = content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n");
      return result;
    }

    // Else, go to the next loop
    // First, dispatch the tool results to the listener
    if (this.newMessageListener) {
      const message: BasicMessage = {
        role: "tool",
        content: toolResults.map((result) => {
          let toolResultContent: Array<TextContentPart | ImageContentPart> = [];
          if (!result.content) {
            toolResultContent = [
              {
                type: "text",
                text: "",
              },
            ];
          } else if (typeof result.content === "string") {
            toolResultContent = [
              {
                type: "text",
                text: result.content,
              },
            ];
          } else {
            for (const part of result.content) {
              if (part.type === "text") {
                toolResultContent.push({
                  type: "text",
                  text: part.text,
                });
              } else if (part.type === "image") {
                if (part.source.type === "base64") {
                  toolResultContent.push({
                    type: "image",
                    dataType: "base64",
                    data: part.source.data,
                    mimeType: part.source.media_type,
                  });
                } else if (part.source.type === "url") {
                  toolResultContent.push({
                    type: "image",
                    dataType: "url",
                    data: part.source.url,
                  });
                }
              }
            }
          }
          return {
            type: "tool_result",
            toolCallId: result.tool_use_id,
            content: toolResultContent,
          };
        }),
      };
      this.newMessageListener(message);
    }

    // Remove the last message's image content
    this.filterLastResult();

    // Add tool results to the conversation
    this.messages.push({
      role: "user",
      content: toolResults,
    });

    return this.loop();
  }

  protected async generate(): Promise<Anthropic.Beta.Messages.BetaMessage> {
    return this.anthropicClient.beta.messages.create({
      model: this.anthropicModel,
      max_tokens: 8192,
      system: this.system,
      tools: this.tools,
      messages: this.messages,
      betas: ["computer-use-2025-01-24"],
      thinking: { type: "enabled", budget_tokens: 4096 },
    });
  }

  private async checkAndCallTools(
    content: Anthropic.Beta.Messages.BetaContentBlock[]
  ) {
    const toolResults: Anthropic.Beta.Messages.BetaToolResultBlockParam[] = [];
    for (const block of content) {
      if (block.type === "text") {
        continue;
      }
      if (block.type === "tool_use") {
        const { id, name, input } = block;

        const tool = this.toolsExecutors[name];
        if (!tool) {
          throw new Error(`Tool ${name} not found`);
        }
        const result = await tool(input);
        const anthropicToolResultcontent: Array<
          | Anthropic.Beta.Messages.BetaTextBlockParam
          | Anthropic.Beta.Messages.BetaImageBlockParam
        > = [];
        if (result.text) {
          anthropicToolResultcontent.push({
            type: "text",
            text: result.text,
          });
        }
        if (result.image) {
          anthropicToolResultcontent.push({
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: result.image,
            },
          });
        }
        toolResults.push({
          type: "tool_result",
          tool_use_id: id,
          content: anthropicToolResultcontent,
        });
      }
    }
    return toolResults;
  }

  private filterLastResult() {
    const lastToolMessage = this.messages.filter(
      (m) =>
        m.role === "user" &&
        typeof m.content !== "string" &&
        m.content.some((part) => part.type === "tool_result")
    )[0];

    if (lastToolMessage) {
      const content =
        lastToolMessage.content as Array<Anthropic.Beta.Messages.BetaContentBlockParam>;
      content.forEach((part) => {
        if (
          part.type !== "tool_result" ||
          !part.content ||
          typeof part.content === "string"
        ) {
          return;
        }
        part.content = part.content.filter((block) => block.type !== "image");
      });
    }
  }

  private getToolSchema(
    parameters: ZodObject<any>
  ): Anthropic.Beta.Messages.BetaTool.InputSchema {
    const jsonSchema = zodToJsonSchema(parameters);
    delete jsonSchema["$schema"];
    return jsonSchema as Anthropic.Beta.Messages.BetaTool.InputSchema;
  }
}
