import { sleep } from "@server/utils/helpers";
import { Browser } from "@server/browser/index";
import { Tool, AnthropicToolDefinition } from "./types";

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

function createDefinition(browser: Browser): AnthropicToolDefinition {
  const dimensions = browser.getDimensions();
  return {
    name: "computer",
    type: "computer_20250124",
    display_width_px: dimensions.width,
    display_height_px: dimensions.height,
  };
}

function getKeyList(text: string) {
  if (!text) {
    return [];
  }
  if (!text.includes("+")) {
    return [text];
  }
  return text.split("+");
}

function createHandler(browser: Browser) {
  return async ({
    action,
    coordinate,
    duration,
    scroll_amount: scrollAmount,
    scroll_direction: scrollDirection,
    start_coordinate: startCoordinate,
    text,
  }: {
    action: string;
    coordinate: number[];
    duration: number;
    scroll_amount: number;
    scroll_direction: string;
    start_coordinate: number[];
    text: string;
  }) => {
    let resultText = "";
    let images = [];
    if (action === ACTION_KEYS.KEY) {
      const keyList = getKeyList(text);
      await browser.keypress(keyList);
    } else if (action === ACTION_KEYS.HOLD_KEY) {
      const keyList = getKeyList(text);
      await browser.keydown(keyList);
      await sleep(duration * 1000);
      await browser.keyup([...keyList].reverse());
    } else if (action === ACTION_KEYS.TYPE) {
      await browser.type(text);
    } else if (action === ACTION_KEYS.CURSOR_POSITION) {
      const { x, y } = browser.cursorPosition();
      resultText = `X: ${x}, Y: ${y}`;
    } else if (action === ACTION_KEYS.MOUSE_MOVE) {
      await browser.move(coordinate[0], coordinate[1]);
    } else if (action === ACTION_KEYS.LEFT_MOUSE_DOWN) {
      await browser.mouseDown("left");
    } else if (action === ACTION_KEYS.LEFT_MOUSE_UP) {
      await browser.mouseUp("left");
    } else if (action === ACTION_KEYS.LEFT_CLICK) {
      if (coordinate && Array.isArray(coordinate) && coordinate.length === 2) {
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
    } else if (action === ACTION_KEYS.RIGHT_CLICK) {
      if (coordinate && Array.isArray(coordinate) && coordinate.length === 2) {
        await browser.move(coordinate[0], coordinate[1]);
      }
      await browser.click("right");
    } else if (action === ACTION_KEYS.MIDDLE_CLICK) {
      if (coordinate && Array.isArray(coordinate) && coordinate.length === 2) {
        await browser.move(coordinate[0], coordinate[1]);
      }
      await browser.click("middle");
    } else if (action === ACTION_KEYS.DOUBLE_CLICK) {
      if (coordinate && Array.isArray(coordinate) && coordinate.length === 2) {
        await browser.move(coordinate[0], coordinate[1]);
      }
      await browser.doubleClick();
    } else if (action === ACTION_KEYS.TRIPLE_CLICK) {
      if (coordinate && Array.isArray(coordinate) && coordinate.length === 2) {
        await browser.move(coordinate[0], coordinate[1]);
      }
      await browser.click("left", 3);
    } else if (action === ACTION_KEYS.SCROLL) {
      const screenBeforeScroll = await browser.screenshot();
      if (coordinate && Array.isArray(coordinate) && coordinate.length === 2) {
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
      const scrollPx = scrollAmount * pxPerClick;
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
      // The time for scroll to take effect is shorter than other actions
      await sleep(500);
      const screenAfterScroll = await browser.screenshot();
      resultText =
        "Scroll success. Here are two screenshots, the first one is before scrolling, the second one is after scrolling.";

      images.push(screenBeforeScroll);
      images.push(screenAfterScroll);
    } else if (action === ACTION_KEYS.WAIT) {
      await sleep(duration * 1000);
    } else if (action === ACTION_KEYS.SCREENSHOT) {
      // Do nothing since we'll take a screenshot after the action
    }

    if (!resultText) {
      resultText = "Success";
    }

    if (images.length === 0) {
      // Wait for 2 second to ensure the action has taken effect
      await sleep(2000);
      const screenshot = await browser.screenshot();
      images.push(screenshot);
    }

    return {
      text: resultText,
      images,
    };
  };
}

export default function createTool(browser: Browser): Tool {
  const definition = createDefinition(browser);
  return {
    name: definition.name,
    definition: definition,
    handle: createHandler(browser),
  };
}
