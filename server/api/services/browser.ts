import { getBrowser } from "@server/browser/index";

export async function getScreenshot() {
  const browser = await getBrowser();
  const screenshot = await browser.screenshot();
  return screenshot;
}
