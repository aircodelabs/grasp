import { chromium } from "playwright";
import sharp from "sharp";
import {
  generateHumanMousePath,
  getMouseClickDelay,
  getMouseImage,
  MOUSE_IMAGE_RADIUS,
} from "./humanMouse.js";
import {
  getHumanTypingSequence,
  getKeyboardPressDelay,
  getHumanKeypressSequence,
} from "./humanKeyboard.js";
import { sleep } from "../utils/helpers.js";

const CUA_KEY_TO_PLAYWRIGHT_KEY = {
  "/": "Divide",
  "\\": "Backslash",
  alt: "Alt",
  arrowdown: "ArrowDown",
  arrowleft: "ArrowLeft",
  arrowright: "ArrowRight",
  arrowup: "ArrowUp",
  backspace: "Backspace",
  capslock: "CapsLock",
  cmd: "Meta",
  ctrl: "Control",
  delete: "Delete",
  end: "End",
  enter: "Enter",
  esc: "Escape",
  home: "Home",
  insert: "Insert",
  option: "Alt",
  pagedown: "PageDown",
  pageup: "PageUp",
  shift: "Shift",
  space: " ",
  super: "Meta",
  tab: "Tab",
  win: "Meta",
  return: "Enter",
};

class Browser {
  dimensions;
  instance;
  currentPage;
  currentMousePosition;
  constructor() {}

  async launch() {
    this.dimensions = {
      width: 1024,
      height: 768,
    };

    const browser = await chromium.launch({
      args: [
        `--window-size=${this.dimensions.width},${this.dimensions.height}`,
        "--disable-extensions",
        "--disable-file-system",
      ],
    });
    this.instance = await browser.newContext({
      viewport: {
        width: this.dimensions.width,
        height: this.dimensions.height,
      },
    });
    this.instance.on("page", (p) => this.__handlePageCreated(p));
    await this.newTab("https://bing.com");
    this.currentMousePosition = {
      x: 0,
      y: 0,
    };
  }

  /** Navigate the browser */
  async tabs() {
    const pages = this.instance.pages();
    const tabs = [];
    for (let index = 0; index < pages.length; index++) {
      const page = pages[index];
      const title = await page.title();
      const url = page.url();
      tabs.push({
        index,
        title,
        url,
      });
    }
    return tabs;
  }
  async currentTab() {
    if (!this.currentPage) {
      return null;
    }
    const pages = this.instance.pages();
    const index = pages.indexOf(this.currentPage);
    const title = await this.currentPage.title();
    const url = this.currentPage.url();
    return { index, title, url };
  }
  async newTab(url) {
    const page = await this.instance.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
  }
  async switchToTab(index) {
    const pages = this.instance.pages();
    if (index < 0 || index >= pages.length) {
      throw new Error(`Invalid tab index: ${index}`);
    }
    this.currentPage = pages[index];
  }
  async goto(url) {
    await this.currentPage.goto(url, { waitUntil: "domcontentloaded" });
  }
  async back() {
    const result = await this.currentPage.goBack();
    return result;
  }
  async forward() {
    await this.currentPage.goForward();
  }
  async refresh() {
    await this.currentPage.reload();
  }

  /** Operate the current page */
  async screenshot(format = "base64") {
    if (!this.currentPage) {
      // throw new Error("No current page");
      return "";
    }
    const screenImage = await this.currentPage.screenshot({
      type: "png",
    });
    const mouseImage = await getMouseImage();
    const combinedImage = await sharp(screenImage)
      .composite([
        {
          input: mouseImage,
          top: this.currentMousePosition.y - MOUSE_IMAGE_RADIUS,
          left: this.currentMousePosition.x - MOUSE_IMAGE_RADIUS,
        },
      ])
      .png()
      .toBuffer();
    if (format === "buffer") {
      return combinedImage;
    } else {
      return combinedImage.toString("base64");
    }
  }
  async mouseDown(button = "left") {
    await this.currentPage.mouse.down({
      button,
    });
  }
  async mouseUp(button = "left") {
    await this.currentPage.mouse.up({
      button,
    });
  }
  async click(button = "left", count = 1) {
    const { x, y } = this.currentMousePosition;
    const delay = getMouseClickDelay();
    await this.currentPage.mouse.click(x, y, {
      button,
      delay,
      clickCount: count,
    });
  }
  async doubleClick() {
    const { x, y } = this.currentMousePosition;
    const delay = getMouseClickDelay();
    await this.currentPage.mouse.dblclick(x, y, {
      delay,
    });
  }
  async scroll(scrollX, scrollY) {
    await this.currentPage.mouse.wheel(scrollX, scrollY);
  }
  async type(text) {
    const sequence = getHumanTypingSequence(text);
    console.log(sequence);
    for (const { char, delay, action } of sequence) {
      if (action === "type") {
        await this.currentPage.keyboard.type(char);
      } else if (action === "press") {
        await this.currentPage.keyboard.press(char);
      }
      await sleep(delay);
    }
  }
  async move(x, y) {
    const path = generateHumanMousePath(
      this.currentMousePosition.x,
      this.currentMousePosition.y,
      x,
      y
    );
    for (const { x, y, delay } of path) {
      await this.currentPage.mouse.move(x, y);
      this.currentMousePosition = { x, y };
      await sleep(delay);
    }
  }
  async keydown(keys) {
    const mappedKeys = keys.map((key) => {
      const normalizedKey = key.trim().toLowerCase();
      return CUA_KEY_TO_PLAYWRIGHT_KEY[normalizedKey] || normalizedKey;
    });
    const sequence = getHumanKeypressSequence(mappedKeys);
    for (const { key, delay } of sequence) {
      await this.currentPage.keyboard.down(key);
      await sleep(delay);
    }
  }
  async keyup(keys) {
    const mappedKeys = keys.map((key) => {
      const normalizedKey = key.trim().toLowerCase();
      return CUA_KEY_TO_PLAYWRIGHT_KEY[normalizedKey] || normalizedKey;
    });
    const sequence = getHumanKeypressSequence(mappedKeys);
    for (const { key, delay } of sequence) {
      await this.currentPage.keyboard.up(key);
      await sleep(delay);
    }
  }
  async keypress(keys) {
    console.log("keys", keys);
    if (keys.length === 1) {
      const delay = getKeyboardPressDelay();
      const normalizedKey = keys[0].trim().toLowerCase();
      const key = CUA_KEY_TO_PLAYWRIGHT_KEY[normalizedKey] || normalizedKey;
      await this.currentPage.keyboard.press(key, { delay });
    } else {
      const extraDelay = getKeyboardPressDelay();
      await this.keydown(keys);
      await sleep(extraDelay);
      await this.keyup([...keys].reverse());
    }
  }
  async drag(path) {
    if (!path || path.length === 0) {
      return;
    }
    await this.move(path[0].x, path[0].y);
    await this.currentPage.mouse.down();
    for (let i = 1; i < path.length; i++) {
      const { x, y } = path[i];
      await this.move(x, y);
    }
    await this.currentPage.mouse.up();
  }
  cursorPosition() {
    return {
      x: this.currentMousePosition.x,
      y: this.currentMousePosition.y,
    };
  }
  /** Private methods */
  __handlePageCreated(page) {
    this.currentPage = page;
    page.on("close", () => this.__handlePageClosed(page));
  }

  __handlePageClosed(page) {
    if (page && page === this.currentPage) {
      const pages = this.instance.pages();
      if (pages.length === 0) {
        // Create a new tab
        this.newTab("https://www.google.com");
      } else {
        this.switchToTab(0);
      }
    }
  }
}

// For now, we use single instance paradigm
let browser;

export async function getBrowser() {
  if (!browser) {
    browser = new Browser();
    await browser.launch();
  }
  return browser;
}
