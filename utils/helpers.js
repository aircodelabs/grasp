export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}
