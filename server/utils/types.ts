/**
 * These are the basic message types used by client and server to communicate with each other.
 */

export type TextContentPart = {
  type: "text";
  text: string;
};

export type ImageContentPart = {
  type: "image";
  dataType: "base64" | "url";
  data: string;
  mimeType?: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
};

export type ToolCallContentPart = {
  type: "tool_call";
  toolCallId: string;
  toolName: string;
  args: string;
};

type UserMessage = {
  role: "user";
  content: Array<TextContentPart | ImageContentPart>;
};

type AssistantMessage = {
  role: "assistant";
  content: Array<TextContentPart | ToolCallContentPart>;
};

type ToolResult = {
  type: "tool_result";
  toolCallId: string;
  content: Array<TextContentPart | ImageContentPart>;
};

type ToolMessage = {
  role: "tool";
  content: Array<ToolResult>;
};

export type BasicMessage = UserMessage | AssistantMessage | ToolMessage;

export type ToolExecutionResult = {
  text?: string;
  image?: string;
};
