import * as playwright from "playwright";
import sharp from "sharp";
import yaml from "yaml";
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
import { ensureDir, sleep } from "../utils/helpers.js";
import { Page } from "playwright";
import path from "path";

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface TabInfo {
  index: number;
  title: string;
  url: string;
}

export type MouseButton = "left" | "right" | "middle";
export type ScreenshotFormat = "base64" | "buffer";

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

// The root page or child iframe
type PageOrFrame = playwright.Page | playwright.FrameLocator;

class Snapshot {
  private frameStack: PageOrFrame[] = [];
  private ymlContent: string = "";

  constructor() {}

  static async create(page: playwright.Page): Promise<Snapshot> {
    const snapshot = new Snapshot();
    await snapshot.buildSnapshot(page);
    return snapshot;
  }

  getYmlContent(): string {
    return this.ymlContent;
  }

  findLocatorByRef(ref: string): playwright.Locator | null {
    if (this.frameStack.length === 0) {
      return null;
    }
    // Get the root page
    let frame = this.frameStack[0];
    const match = ref.match(/^f(\d+)(.*)/);
    if (match) {
      const index = parseInt(match[1], 10);
      frame = this.frameStack[index];
      ref = match[2];
    }
    return frame.locator(ref);
  }

  private async buildSnapshot(page: playwright.Page): Promise<void> {
    const ymlDoc = await this.__snapshotPageOrFrame(page);
    this.ymlContent = ymlDoc.toString({ indentSeq: false }).trim();
  }

  private async __snapshotPageOrFrame(
    pageOrFrame: playwright.Page | playwright.FrameLocator
  ) {
    // Push the frame to the stack
    const frameIndex = this.frameStack.push(pageOrFrame) - 1;
    const snapshotString = await pageOrFrame
      .locator("body")
      .ariaSnapshot({ ref: true });
    const snapshot = yaml.parseDocument(snapshotString);

    // Take care of the iframes
    const visit = async (node: any): Promise<unknown> => {
      if (yaml.isPair(node)) {
        await Promise.all([
          visit(node.key).then((key) => (node.key = key)),
          visit(node.value).then((value) => (node.value = value)),
        ]);
      } else if (yaml.isSeq(node) || yaml.isMap(node)) {
        node.items = await Promise.all(node.items.map(visit));
      } else if (yaml.isScalar(node)) {
        if (typeof node.value === "string") {
          const value = node.value;
          if (frameIndex > 0) {
            node.value = value.replace("[ref=", `[ref=f${frameIndex}]`);
          }
          if (value.startsWith("iframe")) {
            const ref = value.match(/\[ref=(.*)\]/)?.[1];
            if (ref) {
              try {
                const childSnapshot = await this.__snapshotPageOrFrame(
                  pageOrFrame.frameLocator(`aria-ref=${ref}`)
                );
                return snapshot.createPair(node.value, childSnapshot);
              } catch (error) {
                return snapshot.createPair(
                  node.value,
                  "<could not take iframe snapshot>"
                );
              }
            }
          }
        }
      }

      return node;
    };

    await visit(snapshot.contents);
    return snapshot;
  }
}

export class Browser {
  private dimensions: Dimensions;
  private context: playwright.BrowserContext | null;
  private currentPage: playwright.Page | null;
  private currentPageSnapshot: Snapshot | null;
  private currentMousePosition: Position;

  constructor() {
    this.currentPage = null;
    this.currentPageSnapshot = null;
    this.currentMousePosition = { x: 0, y: 0 };
    this.dimensions = { width: 1024, height: 768 };
    this.context = null;
  }

  getDimensions(): Dimensions {
    return this.dimensions;
  }

  async launch(): Promise<void> {
    this.dimensions = {
      width: 1024,
      height: 768,
    };

    const userDataBase =
      process.env.NODE_ENV === "production"
        ? "/"
        : path.join(process.cwd(), ".grasp-local");
    const userDataDir = path.join(
      userDataBase,
      process.env.PLAYWRIGHT_USER_DATA_DIR || "/browser-user-data"
    );
    await ensureDir(userDataDir);

    this.context = await playwright.chromium.launchPersistentContext(
      userDataDir,
      {
        args: [
          `--window-size=${this.dimensions.width},${this.dimensions.height}`,
          "--disable-extensions",
          "--disable-file-system",
        ],
        viewport: {
          width: this.dimensions.width,
          height: this.dimensions.height,
        },
      }
    );
    this.context.on("page", (p) => this.__handlePageCreated(p));
    await this.newTab("https://bing.com");
    this.currentMousePosition = {
      x: 0,
      y: 0,
    };
  }

  /** Navigate the browser */
  async tabs(): Promise<TabInfo[]> {
    if (!this.context) {
      throw new Error("Browser not initialized");
    }
    const pages = this.context.pages();
    const tabs: TabInfo[] = [];
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

  async currentTab(): Promise<TabInfo | null> {
    if (!this.context || !this.currentPage) {
      return null;
    }
    const pages = this.context.pages();
    const index = pages.indexOf(this.currentPage);
    const title = await this.currentPage.title();
    const url = this.currentPage.url();
    return { index, title, url };
  }

  async newTab(url: string): Promise<void> {
    if (!this.context) {
      throw new Error("Browser not initialized");
    }
    const page = await this.context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
  }

  async switchToTab(index: number): Promise<void> {
    if (!this.context) {
      throw new Error("Browser not initialized");
    }
    const pages = this.context.pages();
    if (index < 0 || index >= pages.length) {
      throw new Error(`Invalid tab index: ${index}`);
    }
    this.currentPage = pages[index];
  }

  async goto(url: string): Promise<void> {
    await this.currentPage?.goto(url, { waitUntil: "domcontentloaded" });
  }

  async back(): Promise<null | playwright.Response> {
    return this.currentPage ? await this.currentPage.goBack() : null;
  }

  async forward(): Promise<void> {
    await this.currentPage?.goForward();
  }

  async refresh(): Promise<void> {
    await this.currentPage?.reload();
  }

  // Take a screenshot of the current page
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

  // Take a snapshot of the current page in YAML format, including the child iframes
  async snapshot(): Promise<string> {
    if (!this.currentPage) {
      return "";
    }
    if (!this.currentPageSnapshot) {
      this.currentPageSnapshot = await Snapshot.create(this.currentPage);
    }
    return this.currentPageSnapshot.getYmlContent();
  }

  // Operate by coordinates
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

  // Operate by locator ref
  async clickByRef(
    ref: string,
    button: MouseButton = "left",
    count: number = 1
  ): Promise<void> {
    const locator = this.currentPageSnapshot?.findLocatorByRef(ref);
    if (!locator) {
      throw new Error(`Locator not found: ${ref}`);
    }
    await this.__moveToLocator(locator);
    const delay = getMouseClickDelay();
    await locator.click({
      button,
      delay,
      clickCount: count,
    });
  }

  async dragByRef(startRef: string, endRef: string): Promise<void> {
    const startLocator = this.currentPageSnapshot?.findLocatorByRef(startRef);
    const endLocator = this.currentPageSnapshot?.findLocatorByRef(endRef);
    if (!startLocator || !endLocator) {
      throw new Error("Locator not found");
    }
    await this.__moveToLocator(startLocator);
    const delay = getMouseClickDelay();
    await sleep(delay);
    await startLocator.dragTo(endLocator);
  }

  async hoverByRef(ref: string): Promise<void> {
    const locator = this.currentPageSnapshot?.findLocatorByRef(ref);
    if (!locator) {
      throw new Error("Locator not found");
    }
    await this.__moveToLocator(locator);
    await locator.hover();
  }

  async typeByRef(ref: string, text: string): Promise<void> {
    const locator = this.currentPageSnapshot?.findLocatorByRef(ref);
    if (!locator) {
      throw new Error("Locator not found");
    }
    await this.__moveToLocator(locator);
    const sequence = getHumanTypingSequence(text);
    for (const { char, delay, action } of sequence) {
      if (action === "type") {
        await locator.pressSequentially(char);
      } else if (action === "press") {
        await locator.press(char);
      }
      await sleep(delay);
    }
  }

  async selectOptionByRef(ref: string, values: string[]): Promise<void> {
    const locator = this.currentPageSnapshot?.findLocatorByRef(ref);
    if (!locator) {
      throw new Error("Locator not found");
    }
    await this.__moveToLocator(locator);
    const delay = getMouseClickDelay();
    await sleep(delay);
    await locator.selectOption(values);
  }

  /** Private methods */
  private async __moveToLocator(locator: playwright.Locator): Promise<void> {
    // First, we make sure the element is in the viewport
    await locator.scrollIntoViewIfNeeded();
    // Then, we move the mouse to the center of the element
    const box = await locator.boundingBox();
    if (!box) {
      throw new Error("Element is not visible");
    }
    await this.move(box.x + box.width / 2, box.y + box.height / 2);
  }

  private __handlePageCreated(page: Page): void {
    this.currentPage = page;
    page.on("close", () => this.__handlePageClosed(page));
  }

  private async __handlePageClosed(page: Page): Promise<void> {
    if (!this.context) return;
    if (page && page === this.currentPage) {
      const pages = this.context.pages();
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
