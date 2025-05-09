import type { Browser } from "../browser/index.js";
import { generateText, LanguageModelV1 } from "ai";
import createBrowserNavigate from "./tools/common/browser-navigate.js";

const PROVIDERS_MAP: Record<string, string | undefined> = {
  anthropic: "@ai-sdk/anthropic",
};

const MODELS_MAP: Record<string, string> = {
  anthropic: "claude-3-7-sonnet-20250219",
};

export async function handle(
  providerName: string,
  task: string,
  browser: Browser
) {
  const providerPkgName = PROVIDERS_MAP[providerName];
  if (!providerPkgName) {
    throw new Error(`Provider ${providerName} not supported`);
  }
  const providerPkg = await import(providerPkgName);
  const modelName = MODELS_MAP[providerName];
  const model = providerPkg[providerName](modelName) as LanguageModelV1;

  const system = `You are utilizing a Chrome browser environment. You can only use the Chrome browser to perform actions.
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

  const browserNavigateTool = createBrowserNavigate(browser);
  const tools = {
    browser_navigate: browserNavigateTool.definition,
  };

  const messages = [
    {
      role: "user",
      content: task,
    },
  ];

  while (true) {
    const result = await generateText({
      model,
      system,
    });
  }
}
