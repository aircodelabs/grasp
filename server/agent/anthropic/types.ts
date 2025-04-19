import Anthropic from "@anthropic-ai/sdk";

export type AnthropicMessage = Anthropic.Beta.Messages.BetaMessageParam;
export type AnthropicToolDefinition = Anthropic.Beta.Messages.BetaToolUnion;
export type ToolExecutionResult = {
  text?: string;
  images?: string[];
};
export type Tool = {
  name: string;
  definition: AnthropicToolDefinition;
  handle: (input: any) => Promise<ToolExecutionResult>;
};
