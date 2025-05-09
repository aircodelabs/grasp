import type { ToolDefinition, ToolExecutionResult } from "../types.js";
import type Anthropic from "@anthropic-ai/sdk";

type AnthropicToolDefinition = Anthropic.Messages.Tool;
type AnthropicToolExecutionResultContent =
  Anthropic.Messages.ToolResultBlockParam["content"];

export function transformToolExecutionResult(
  result: ToolExecutionResult
): AnthropicToolExecutionResultContent {
  if (!result.images || result.images.length === 0) {
    return result.text;
  }

  const content: AnthropicToolExecutionResultContent = [];
  if (result.text) {
    content.push({
      type: "text",
      text: result.text,
    });
  }

  for (const image of result.images) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: image,
      },
    });
  }

  return content;
}
