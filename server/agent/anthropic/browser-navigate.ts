import Anthropic from "@anthropic-ai/sdk";
import { sleep } from "@server/utils/helpers";
import { Browser } from "@server/browser/index";
import { Tool } from "./types";
const ACTION_KEYS = {
  TABS: "tabs",
  CURRENT_TAB: "current_tab",
  NEW_TAB: "new_tab",
  SWITCH_TO_TAB: "switch_to_tab",
  GOTO: "goto",
  BACK: "back",
  FORWARD: "forward",
  REFRESH: "refresh",
};

const definition: Anthropic.Beta.Messages.BetaToolUnion = {
  name: "browser_navigate",
  description: "Navigate the browser",
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        description: `The action to perform. The available actions are:
* "tabs": Get a list of all open tabs.
* "current_tab": Get the current tab you are on.
* "new_tab": Create a new tab, and navigate to the URL you provide.
* "switch_to_tab": Switch to another tab.
* "goto": Navigate current tab to the URL you provide. This won't create a new tab.
* "back": Go back to the previous page in the current tab.
* "forward": Go forward to the next page in the current tab.
* "refresh": Refresh the current page.`,
        enum: Object.values(ACTION_KEYS),
      },
      url: {
        type: "string",
        description: `The URL to navigate to. Required only by \`action=new_tab\` or \`action=goto\`.`,
      },
      tab_index: {
        type: "integer",
        description: `The index of the page to switch to. Required only by \`action=switch_to_tab\`.`,
        minimum: 0,
      },
    },
    required: ["action"],
  },
};

function createHandler(browser: Browser) {
  return async ({
    action,
    url,
    tab_index: tabIndex,
  }: {
    action: string;
    url?: string;
    tab_index?: number;
  }) => {
    let text = "";
    let images = [];
    switch (action) {
      case ACTION_KEYS.TABS:
        const tabs = await browser.tabs();
        text = JSON.stringify(tabs);
        break;
      case ACTION_KEYS.CURRENT_TAB:
        const currentTab = await browser.currentTab();
        text = JSON.stringify(currentTab);
        break;
      case ACTION_KEYS.NEW_TAB:
        if (!url) {
          throw new Error("URL is required for new_tab action");
        }
        await browser.newTab(url);
        break;
      case ACTION_KEYS.SWITCH_TO_TAB:
        if (!tabIndex) {
          throw new Error("Tab index is required for switch_to_tab action");
        }
        await browser.switchToTab(tabIndex);
        break;
      case ACTION_KEYS.GOTO:
        if (!url) {
          throw new Error("URL is required for goto action");
        }
        await browser.goto(url);
        break;
      case ACTION_KEYS.BACK:
        const result = await browser.back();
        if (result === null) {
          text =
            "No previous page to go back to. Maybe the previous page opened a new tab. Use tabs to check it and use switch_to_tab to switch to the one you want.";
        }
        break;
      case ACTION_KEYS.FORWARD:
        await browser.forward();
        break;
      case ACTION_KEYS.REFRESH:
        await browser.refresh();
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    if (!text) {
      text = "Success";
    }

    if (images.length === 0) {
      // Wait 2 seconds to ensure the action has taken effect
      await sleep(2000);
      const screenshot = await browser.screenshot();
      images.push(screenshot);
    }

    return {
      text,
      images,
    };
  };
}

export default function createTool(browser: Browser): Tool {
  return {
    name: definition.name,
    definition,
    handle: createHandler(browser),
  };
}
