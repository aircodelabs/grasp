import AnthropicAgent from "./anthropic.js";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import type { Browser } from "../../browser/index.js";
import type { Anthropic } from "@anthropic-ai/sdk";

export default class BedrockAgent extends AnthropicAgent {
  private bedrockModel: string;
  private bedrockClient: AnthropicBedrock;

  constructor(browser: Browser) {
    super(browser);
    this.bedrockModel = "us.anthropic.claude-3-7-sonnet-20250219-v1:0";
    this.bedrockClient = new AnthropicBedrock();
  }

  // @override
  protected async generate() {
    console.log("Start generate");
    const response = await this.bedrockClient.beta.messages.create({
      model: this.bedrockModel,
      max_tokens: 8192,
      system: this.system,
      tools: this.tools,
      messages: this.messages,
      betas: ["computer-use-2025-01-24"],
      thinking: { type: "enabled", budget_tokens: 4096 },
    });
    console.log("Generate done", response.content);
    return response as Anthropic.Beta.Messages.BetaMessage;
  }
}
