import type { ToolDefinition } from "../tools/types.js";

export default abstract class Provider {
  abstract transformToolDefinition(definition: ToolDefinition): ;
}
