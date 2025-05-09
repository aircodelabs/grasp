import type { Tool as AISDKTool } from "ai";

export type ToolDefinition = AISDKTool;

export type ToolExecutionResult = {
  text?: string;
  images?: string[];
};

export type ToolExecution = (input: any) => Promise<ToolExecutionResult>;
