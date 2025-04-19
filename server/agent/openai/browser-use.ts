// import { Browser,  } from "@server/browser";
// import { sleep } from "@server/utils/helpers";

// const ACTION_KEYS = {
//   SCREENSHOT: "screenshot",
//   CLICK: "click",
//   DOUBLE_CLICK: "double_click",
//   SCROLL: "scroll",
//   TYPE: "type",
//   WAIT: "wait",
//   MOVE: "move",
//   KEYPRESS: "keypress",
//   DRAG: "drag",
// };

// function createDefinition(browser: Browser) {
//   const { dimensions } = browser;
//   return {
//     type: "computer_use_preview",
//     display_width: dimensions.width,
//     display_height: dimensions.height,
//     environment: "browser",
//   };
// }

// function createHandler(browser: Browser) {
//   return async ({
//     type,
//     x,
//     y,
//     button,
//     scroll_x: scrollX,
//     scroll_y: scrollY,
//     text,
//     ms,
//     keys,
//     path,
//   }: {
//     type: string;
//     x: number;
//     y: number;
//     button: string;
//     scroll_x: number;
//     scroll_y: number;
//     text: string;
//     ms: number;
//     keys: string[];
//     path: string[][];
//   }) => {
//     switch (type) {
//       case ACTION_KEYS.SCREENSHOT:
//         // Do nothing since we'll take a screenshot after the action
//         break;
//       case ACTION_KEYS.CLICK:
//         switch (button) {
//           case "back":
//             await browser.back();
//             break;
//           case "forward":
//             await browser.forward();
//             break;
//           case "wheel":
//             // When button is wheel, we use x and y as scrollX and scrollY
//             await browser.scroll(x, y);
//             break;
//           default:
//             await browser.move(x, y);
//             await browser.click(button);
//             break;
//         }
//       case ACTION_KEYS.DOUBLE_CLICK:
//         await browser.move(x, y);
//         await browser.doubleClick();
//         break;
//       case ACTION_KEYS.SCROLL:
//         await browser.move(x, y);
//         await browser.scroll(scrollX, scrollY);
//         break;
//       case ACTION_KEYS.TYPE:
//         await browser.type(text);
//         break;
//       case ACTION_KEYS.WAIT:
//         await sleep(ms);
//         break;
//       case ACTION_KEYS.MOVE:
//         await browser.move(x, y);
//         break;
//       case ACTION_KEYS.KEYPRESS:
//         await browser.keypress(keys);
//         break;
//       case ACTION_KEYS.DRAG:
//         await browser.drag(path);
//         break;
//       default:
//         throw new Error(`Unknown action: ${type}`);
//     }
//     // Wait for 1 second to ensure the action has taken effect
//     await sleep(1000);
//     const screenshot = await browser.screenshot();
//     const currentTab = await browser.currentTab();
//     return { text: currentTab.url, image: screenshot };
//   };
// }

// export default function createTool(browser) {
//   return {
//     name: "browser_use",
//     definition: createDefinition(browser),
//     handle: createHandler(browser),
//   };
// }
