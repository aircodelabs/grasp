import OpenAI, { AzureOpenAI } from "openai";
import OpenAIAgent from "./openai.js";
import type { Browser } from "../../browser/index.js";
export default class AzureAgent extends OpenAIAgent {
  private azureOpenAIModel: "computer-use-preview" = "computer-use-preview";
  private azureOpenAIClient: AzureOpenAI;

  constructor(browser: Browser) {
    super(browser);

    const resourceName = process.env.AZURE_RESOURCE_NAME;
    if (!resourceName) {
      throw new Error("Missing AZURE_RESOURCE_NAME.");
    }
    const endpoint = `https://${resourceName}.openai.azure.com`;

    this.azureOpenAIClient = new AzureOpenAI({
      apiKey: process.env.AZURE_API_KEY,
      apiVersion: process.env.AZURE_API_VERSION,
      endpoint,
    });
  }

  // @override
  protected async generate(): Promise<OpenAI.Responses.Response> {
    return this.azureOpenAIClient.responses.create({
      model: this.azureOpenAIModel,
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
}
