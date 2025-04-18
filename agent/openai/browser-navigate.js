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

const definition = {
  strict: true,
  type: "function",
  name: "browser_navigate",
  description: "Navigate the browser",
  parameters: {
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
        type: ["string", "null"],
        description: `The URL to navigate to. Required only by \`action=new_tab\` or \`action=goto\`.`,
      },
      tab_index: {
        type: ["integer", "null"],
        description: `The index of the page to switch to. Required only by \`action=switch_to_tab\`.`,
      },
    },
    additionalProperties: false,
    required: ["action", "url", "tab_index"],
  },
};

function createHandler(browser) {
  return async ({ action, url, tab_index: tabIndex }) => {
    let screenshot;
    switch (action) {
      case ACTION_KEYS.TABS:
        const tabs = await browser.tabs();
        return {
          text: JSON.stringify(tabs),
        };
      case ACTION_KEYS.CURRENT_TAB:
        const currentTab = await browser.currentTab();
        screenshot = await browser.screenshot();
        return {
          text: JSON.stringify(currentTab),
          image: screenshot,
        };
      case ACTION_KEYS.NEW_TAB:
        await browser.newTab(url);
        screenshot = await browser.screenshot();
        return {
          text: "New tab created",
          image: screenshot,
        };
      case ACTION_KEYS.SWITCH_TO_TAB:
        await browser.switchToTab(tabIndex);
        screenshot = await browser.screenshot();
        return {
          text: `Switched to tab ${tabIndex}`,
          image: screenshot,
        };
      case ACTION_KEYS.GOTO:
        await browser.goto(url);
        screenshot = await browser.screenshot();
        return {
          text: `Navigated to ${url}`,
          image: screenshot,
        };
      case ACTION_KEYS.BACK:
        await browser.back();
        screenshot = await browser.screenshot();
        return {
          text: "Navigated back",
          image: screenshot,
        };
      case ACTION_KEYS.FORWARD:
        await browser.forward();
        screenshot = await browser.screenshot();
        return {
          text: "Navigated forward",
          image: screenshot,
        };
      case ACTION_KEYS.REFRESH:
        await browser.refresh();
        screenshot = await browser.screenshot();
        return {
          text: "Refreshed page",
          image: screenshot,
        };
      default:
        return {
          text: `Unknown action: ${action}`,
        };
    }
  };
}

export default function createTool(browser) {
  return {
    name: definition.name,
    definition,
    handle: createHandler(browser),
  };
}
