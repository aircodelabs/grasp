export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
