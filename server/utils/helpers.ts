import fs from "fs/promises";

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export async function ensureDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}
