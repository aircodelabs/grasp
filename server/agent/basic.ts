import type { Browser } from "../browser/index.js";
import type { BasicMessage } from "../utils/types.js";

export default class BasicAgent {
  protected system: string;
  protected newMessageListener?: (message: BasicMessage) => void;

  constructor(browser: Browser) {
    this.system = `You are utilizing a Chrome browser environment. You can only use the Chrome browser to perform actions.
You can use the computer tool to interact with the page.
You should use browser_navigate tool to navigate the browser.
If you see nothing, try going to bing.com.
If you scroll and nothing changes, it means you have already reached the bottom or top of this window, do not continue scrolling.
The current date is ${new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}.
To reduce cost, previous screenshot images have been removed from the conversation. Only the recent screenshot is included.`;
  }

  setNewMessageListener(listener: (message: BasicMessage) => void) {
    this.newMessageListener = listener;
  }

  async handle(task: string): Promise<string> {
    throw new Error("Handle Not implemented");
  }

  protected async loop(): Promise<string> {
    throw new Error("Loop Not implemented");
    // if (!this.model) {
    //   // Not using AI SDK, should be implemented by the subclass
    //   throw new Error("Model not set");
    // }
    // const { text, toolResults, response } = await generateText({
    //   model: this.model,
    //   system: this.system,
    //   messages: this.messages,
    // });
    // if (this.newMessagesListener) {
    //   this.newMessagesListener(response.messages);
    // }
    // // If no tools were used, return the content
    // if (toolResults.length === 0) {
    //   return text;
    // }
    // // Remove the last message's image content
    // this.filterLastResult();
    // // Add new messages to the conversation
    // this.messages.push(...response.messages);
    // return this.loop();
  }
}
