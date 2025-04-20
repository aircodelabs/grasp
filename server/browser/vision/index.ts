import {
  chromium,
  Browser as PlaywrightBrowser,
  BrowserContext,
  Page,
  Response,
} from "playwright";
import sharp from "sharp";
import {
  generateHumanMousePath,
  getMouseClickDelay,
  getMouseImage,
  MOUSE_IMAGE_RADIUS,
} from "./humanMouse";
import {
  getHumanTypingSequence,
  getKeyboardPressDelay,
  getHumanKeypressSequence,
} from "./humanKeyboard";
import { sleep } from "@server/utils/helpers";

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Tab {
  index: number;
  title: string;
  url: string;
}

type MouseButton = "left" | "right" | "middle";
type ScreenshotFormat = "base64" | "buffer";

const CUA_KEY_TO_PLAYWRIGHT_KEY: Record<string, string> = {
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

export class Browser {
  private dimensions: Dimensions;
  private instance: BrowserContext | null;
  private currentPage: Page | null;
  private currentMousePosition: Position;

  constructor() {
    this.currentPage = null;
    this.currentMousePosition = { x: 0, y: 0 };
    this.dimensions = { width: 1024, height: 768 };
    this.instance = null;
  }

  getDimensions(): Dimensions {
    return this.dimensions;
  }

  async launch(): Promise<void> {
    this.dimensions = {
      width: 1024,
      height: 768,
    };

    const browser: PlaywrightBrowser = await chromium.launch({
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
  async tabs(): Promise<Tab[]> {
    if (!this.instance) {
      throw new Error("Browser not initialized");
    }
    const pages = this.instance.pages();
    const tabs: Tab[] = [];
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

  async currentTab(): Promise<Tab | null> {
    if (!this.instance || !this.currentPage) {
      return null;
    }
    const pages = this.instance.pages();
    const index = pages.indexOf(this.currentPage);
    const title = await this.currentPage.title();
    const url = this.currentPage.url();
    return { index, title, url };
  }

  async newTab(url: string): Promise<void> {
    if (!this.instance) {
      throw new Error("Browser not initialized");
    }
    const page = await this.instance.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
  }

  async switchToTab(index: number): Promise<void> {
    if (!this.instance) {
      throw new Error("Browser not initialized");
    }
    const pages = this.instance.pages();
    if (index < 0 || index >= pages.length) {
      throw new Error(`Invalid tab index: ${index}`);
    }
    this.currentPage = pages[index];
  }

  async goto(url: string): Promise<void> {
    await this.currentPage?.goto(url, { waitUntil: "domcontentloaded" });
  }

  async back(): Promise<null | Response> {
    return this.currentPage ? await this.currentPage.goBack() : null;
  }

  async forward(): Promise<void> {
    await this.currentPage?.goForward();
  }

  async refresh(): Promise<void> {
    await this.currentPage?.reload();
  }

  /** Operate the current page */
  async screenshot(format: "buffer"): Promise<Buffer>;
  async screenshot(format?: "base64"): Promise<string>;
  async screenshot(
    format: ScreenshotFormat = "base64"
  ): Promise<string | Buffer> {
    if (!this.currentPage) {
      return format === "buffer" ? Buffer.from("") : "";
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

    return format === "buffer"
      ? combinedImage
      : combinedImage.toString("base64");
  }

  async mouseDown(button: MouseButton = "left"): Promise<void> {
    if (!this.currentPage) return;
    await this.currentPage.mouse.down({
      button,
    });
  }

  async mouseUp(button: MouseButton = "left"): Promise<void> {
    if (!this.currentPage) return;
    await this.currentPage.mouse.up({
      button,
    });
  }

  async click(button: MouseButton = "left", count = 1): Promise<void> {
    if (!this.currentPage) return;
    const { x, y } = this.currentMousePosition;
    const delay = getMouseClickDelay();
    await this.currentPage.mouse.click(x, y, {
      button,
      delay,
      clickCount: count,
    });
  }

  async doubleClick(): Promise<void> {
    const { x, y } = this.currentMousePosition;
    const delay = getMouseClickDelay();
    await this.currentPage?.mouse.dblclick(x, y, {
      delay,
    });
  }

  async scroll(scrollX: number, scrollY: number): Promise<void> {
    await this.currentPage?.mouse.wheel(scrollX, scrollY);
  }

  async type(text: string): Promise<void> {
    if (!this.currentPage) return;
    const sequence = getHumanTypingSequence(text);
    for (const { char, delay, action } of sequence) {
      if (action === "type") {
        await this.currentPage.keyboard.type(char);
      } else if (action === "press") {
        await this.currentPage.keyboard.press(char);
      }
      await sleep(delay);
    }
  }

  async move(x: number, y: number): Promise<void> {
    if (!this.currentPage) return;
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

  async keydown(keys: string[]): Promise<void> {
    if (!this.currentPage) return;
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

  async keyup(keys: string[]): Promise<void> {
    if (!this.currentPage) return;
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

  async keypress(keys: string[]): Promise<void> {
    if (!this.currentPage) return;
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

  async drag(path: Position[]): Promise<void> {
    if (!this.currentPage) return;
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

  cursorPosition(): Position {
    return {
      x: this.currentMousePosition.x,
      y: this.currentMousePosition.y,
    };
  }

  /** Private methods */
  private __handlePageCreated(page: Page): void {
    this.currentPage = page;
    page.on("close", () => this.__handlePageClosed(page));
  }

  private async __handlePageClosed(page: Page): Promise<void> {
    if (!this.instance) return;
    if (page && page === this.currentPage) {
      const pages = this.instance.pages();
      if (pages.length === 0) {
        // Create a new tab
        await this.newTab("https://www.google.com");
      } else {
        await this.switchToTab(0);
      }
    }
  }
}

// For now, we use single instance paradigm
let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = new Browser();
    await browser.launch();
  }
  return browser;
}
