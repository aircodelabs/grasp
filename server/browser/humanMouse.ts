import sharp from "sharp";
import { randomInRange } from "../utils/helpers.js";

interface Point {
  x: number;
  y: number;
}

interface PathPoint extends Point {
  index: number;
  delay: number;
}

/** Mouse click event */
const MOUSE_CLICK_DELAY_BASE = 100;

export function getMouseClickDelay(): number {
  // Simulate human-like delay between mouse down and up
  // Base delay is around 100ms, with a small random variation
  const variation = randomInRange(-40, 40);
  return Math.floor(MOUSE_CLICK_DELAY_BASE + variation);
}

/** Mouse move event */
function bezierCurve(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  numPoints: number
): Point[] {
  const points: Point[] = [];
  for (let t = 0; t <= 1; t += 1 / numPoints) {
    const x =
      Math.pow(1 - t, 3) * x0 +
      3 * Math.pow(1 - t, 2) * t * x1 +
      3 * (1 - t) * Math.pow(t, 2) * x2 +
      Math.pow(t, 3) * x3;
    const y =
      Math.pow(1 - t, 3) * y0 +
      3 * Math.pow(1 - t, 2) * t * y1 +
      3 * (1 - t) * Math.pow(t, 2) * y2 +
      Math.pow(t, 3) * y3;
    points.push({ x, y });
  }
  return points;
}

export function generateHumanMousePath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  speedFactor = 1
): PathPoint[] {
  const distance = Math.sqrt(
    Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
  );

  const firstControl: Point = {
    x: startX + randomInRange(-0.2 * distance, 0.2 * distance),
    y: startY + randomInRange(0.1 * distance, 0.3 * distance),
  };
  const secondControl: Point = {
    x: endX + randomInRange(-0.2 * distance, 0.2 * distance),
    y: endY - randomInRange(0.1 * distance, 0.3 * distance),
  };

  const baseNumPoints = Math.max(30, Math.min(100, Math.floor(distance / 10)));
  const numPoints = Math.max(10, Math.floor(baseNumPoints / speedFactor));

  const path = bezierCurve(
    startX,
    startY,
    firstControl.x,
    firstControl.y,
    secondControl.x,
    secondControl.y,
    endX,
    endY,
    numPoints
  );

  const calculatedPath: PathPoint[] = path.map((point, index) => {
    const progress = index / path.length;

    const baseSpeed = randomInRange(5, 20);
    const speedFactor =
      1 + Math.sin(progress * Math.PI) * randomInRange(0.8, 1.2);

    const delay = Math.max(1, (baseSpeed * speedFactor) / speedFactor);

    const jitterAmount =
      distance > 200 ? randomInRange(-3, 3) : randomInRange(-1, 1);

    return {
      index,
      x: Math.floor(point.x + jitterAmount),
      y: Math.floor(point.y + jitterAmount),
      delay: Math.floor(delay),
    };
  });

  // The last point should be the end point
  const delay = Math.floor(Math.random() * 30);
  calculatedPath.push({
    index: calculatedPath.length,
    x: endX,
    y: endY,
    delay,
  });

  return calculatedPath;
}

/** The mouse image to be used in the screenshot */
let mouseImage: Buffer | null = null;
export const MOUSE_IMAGE_RADIUS = 10;

export async function getMouseImage(): Promise<Buffer> {
  if (!mouseImage) {
    const circleSize = MOUSE_IMAGE_RADIUS * 2;
    const color = "rgba(255, 0, 0, 1)";
    mouseImage = await sharp({
      create: {
        width: circleSize,
        height: circleSize,
        channels: 4, // RGBA
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // transparent background
      },
    })
      .composite([
        {
          input: Buffer.from(`
          <svg width="${circleSize}" height="${circleSize}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${MOUSE_IMAGE_RADIUS}" cy="${MOUSE_IMAGE_RADIUS}" r="${MOUSE_IMAGE_RADIUS}" fill="${color}" />
          </svg>
        `),
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer();
  }
  return mouseImage;
}
