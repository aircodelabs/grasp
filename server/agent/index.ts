import type { Browser } from "../browser/index.js";
import type BasicAgent from "./basic.js";
import type { BasicMessage } from "../utils/types.js";
export async function handle(
  providerName: string,
  task: string,
  browser: Browser,
  onNewMessage: (message: BasicMessage) => void
) {
  const agentPkg = await import(`./providers/${providerName}.js`);
  const agent = new agentPkg.default(browser) as BasicAgent;
  agent.setNewMessageListener(onNewMessage);

  const result = await agent.handle(task);

  return result;
}
