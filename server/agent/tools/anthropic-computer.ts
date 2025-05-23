import { sleep } from "../../utils/helpers.js";
import type { Browser } from "../../browser/index.js";
import type { ToolExecutionResult } from "../../utils/types.js";
const ACTION_KEYS = {
  KEY: "key",
  HOLD_KEY: "hold_key",
  TYPE: "type",
  CURSOR_POSITION: "cursor_position",
  MOUSE_MOVE: "mouse_move",
  LEFT_MOUSE_DOWN: "left_mouse_down",
  LEFT_MOUSE_UP: "left_mouse_up",
  LEFT_CLICK: "left_click",
  LEFT_CLICK_DRAG: "left_click_drag",
  RIGHT_CLICK: "right_click",
  MIDDLE_CLICK: "middle_click",
  DOUBLE_CLICK: "double_click",
  TRIPLE_CLICK: "triple_click",
  SCROLL: "scroll",
  WAIT: "wait",
  SCREENSHOT: "screenshot",
};

function getKeyList(text?: string) {
  if (!text) {
    return [];
  }
  if (!text.includes("+")) {
    return [text];
  }
  return text.split("+");
}

export default function createTool(browser: Browser) {
  const dimensions = browser.getDimensions();

  return {
    name: "computer",
    type: "computer_20250124",
    display_width_px: dimensions.width,
    display_height_px: dimensions.height,
    execute: async ({
      action,
      coordinate,
      duration,
      scroll_amount: scrollAmount,
      scroll_direction: scrollDirection,
      start_coordinate: startCoordinate,
      text,
    }: {
      action: string;
      coordinate?: [number, number];
      duration?: number;
      scroll_amount?: number;
      scroll_direction?: string;
      start_coordinate?: [number, number];
      text?: string;
    }): Promise<ToolExecutionResult> => {
      let resultText = "";
      let image = "";
      if (action === ACTION_KEYS.KEY) {
        const keyList = getKeyList(text);
        await browser.keypress(keyList);
      } else if (action === ACTION_KEYS.HOLD_KEY) {
        const keyList = getKeyList(text);
        await browser.keydown(keyList);
        await sleep((duration || 1) * 1000);
        await browser.keyup([...keyList].reverse());
      } else if (action === ACTION_KEYS.TYPE) {
        if (text) {
          await browser.type(text);
          // Wait 2 seconds to ensure the action has taken effect
          await sleep(2000);
          image = await browser.screenshot();
        }
      } else if (action === ACTION_KEYS.CURSOR_POSITION) {
        const { x, y } = browser.cursorPosition();
        resultText = `X: ${x}, Y: ${y}`;
      } else if (action === ACTION_KEYS.MOUSE_MOVE) {
        if (
          coordinate &&
          Array.isArray(coordinate) &&
          coordinate.length === 2
        ) {
          await browser.move(coordinate[0], coordinate[1]);
        }
      } else if (action === ACTION_KEYS.LEFT_MOUSE_DOWN) {
        await browser.mouseDown("left");
      } else if (action === ACTION_KEYS.LEFT_MOUSE_UP) {
        await browser.mouseUp("left");
      } else if (action === ACTION_KEYS.LEFT_CLICK) {
        if (
          coordinate &&
          Array.isArray(coordinate) &&
          coordinate.length === 2
        ) {
          await browser.move(coordinate[0], coordinate[1]);
        }
        // If text is provided, hold the keys while clicking
        if (text) {
          const keyList = getKeyList(text);
          await browser.keydown(keyList);
          await browser.click();
          await browser.keyup([...keyList].reverse());
        } else {
          await browser.click();
        }
      } else if (action === ACTION_KEYS.LEFT_CLICK_DRAG) {
        if (
          startCoordinate &&
          Array.isArray(startCoordinate) &&
          startCoordinate.length === 2 &&
          coordinate &&
          Array.isArray(coordinate) &&
          coordinate.length === 2
        ) {
          const path = [
            {
              x: startCoordinate[0],
              y: startCoordinate[1],
            },
            {
              x: coordinate[0],
              y: coordinate[1],
            },
          ];
          await browser.drag(path);
        }
      } else if (action === ACTION_KEYS.RIGHT_CLICK) {
        if (
          coordinate &&
          Array.isArray(coordinate) &&
          coordinate.length === 2
        ) {
          await browser.move(coordinate[0], coordinate[1]);
        }
        await browser.click("right");
      } else if (action === ACTION_KEYS.MIDDLE_CLICK) {
        if (
          coordinate &&
          Array.isArray(coordinate) &&
          coordinate.length === 2
        ) {
          await browser.move(coordinate[0], coordinate[1]);
        }
        await browser.click("middle");
      } else if (action === ACTION_KEYS.DOUBLE_CLICK) {
        if (
          coordinate &&
          Array.isArray(coordinate) &&
          coordinate.length === 2
        ) {
          await browser.move(coordinate[0], coordinate[1]);
        }
        await browser.doubleClick();
      } else if (action === ACTION_KEYS.TRIPLE_CLICK) {
        if (
          coordinate &&
          Array.isArray(coordinate) &&
          coordinate.length === 2
        ) {
          await browser.move(coordinate[0], coordinate[1]);
        }
        await browser.click("left", 3);
      } else if (action === ACTION_KEYS.SCROLL) {
        if (
          coordinate &&
          Array.isArray(coordinate) &&
          coordinate.length === 2
        ) {
          await browser.move(coordinate[0], coordinate[1]);
        }
        if (
          startCoordinate &&
          Array.isArray(startCoordinate) &&
          startCoordinate.length === 2
        ) {
          await browser.move(startCoordinate[0], startCoordinate[1]);
        }
        // If text is provided, hold the keys while scrolling
        const keyList = getKeyList(text);
        if (keyList.length > 0) {
          await browser.keydown(keyList);
        }
        // Calculate the scroll amount in pixels
        const pxPerClick = 50;
        const scrollPx = (scrollAmount || 0) * pxPerClick;
        let scrollX = 0;
        let scrollY = 0;
        if (scrollDirection === "up") {
          scrollY = -scrollPx;
        } else if (scrollDirection === "down") {
          scrollY = scrollPx;
        } else if (scrollDirection === "left") {
          scrollX = -scrollPx;
        } else if (scrollDirection === "right") {
          scrollX = scrollPx;
        }
        await browser.scroll(scrollX, scrollY);
        // Release the keys after scrolling
        if (keyList.length > 0) {
          await browser.keyup([...keyList].reverse());
        }
      } else if (action === ACTION_KEYS.WAIT) {
        await sleep((duration || 1) * 1000);
      } else if (action === ACTION_KEYS.SCREENSHOT) {
        image = await browser.screenshot();
      }

      if (!resultText) {
        resultText = "Success";
      }

      return {
        text: resultText,
        image,
      };
    },
  };
}
