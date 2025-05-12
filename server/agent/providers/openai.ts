import OpenAI from "openai";
import BasicAgent from "../basic.js";
import type { Browser } from "../../browser/index.js";
import createBrowserNavigateTool from "../tools/browser-navigate.js";
import createOpenaiComputerTool from "../tools/openai-computer.js";
import type { ToolExecutionResult } from "../../utils/types.js";
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

    const browserNavigate = createBrowserNavigateTool(browser);
    this.tools.push({
      type: "function",
      name: browserNavigate.name,
      description: browserNavigate.description,
      strict: true,
      parameters: this.getToolSchema(browserNavigate.parameters),
    });
    this.toolsExecutors[browserNavigate.name] = browserNavigate.execute;

    const computerTool = createOpenaiComputerTool(browser);
    this.tools.push({
      type: "computer_use_preview" as "computer-preview",
      display_width: computerTool.display_width,
      display_height: computerTool.display_height,
      environment: "browser",
    });
    this.toolsExecutors["computer"] = computerTool.execute;

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
          "Use the browser_navigate functions to navigate the browser. If you see nothing, try going to google.com.",
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
    this.input = [];
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
