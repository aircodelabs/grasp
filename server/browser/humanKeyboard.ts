import { randomInRange } from "../utils/helpers.js";

type KeyboardMap = {
  [key: string]: string;
};

interface TypingAction {
  char: string;
  delay: number;
  action: "type" | "press";
}

interface KeypressAction {
  key: string;
  delay: number;
}

/** Keyboard typing event */
function getRandomCharNear(char: string): string {
  const keyboardMap: KeyboardMap = {
    a: "qwsz",
    b: "vghn",
    c: "xdfv",
    d: "ersfcx",
    e: "wsdr",
    f: "rtgdcv",
    g: "tyhfvb",
    h: "yujgbn",
    i: "ujko",
    j: "uikhnm",
    k: "ijolm",
    l: "kop",
    m: "njk",
    n: "bhjm",
    o: "iklp",
    p: "ol",
    q: "wa",
    r: "edft",
    s: "awedxz",
    t: "rfgy",
    u: "yhji",
    v: "cfgb",
    w: "qase",
    x: "zsdc",
    y: "tghu",
    z: "asx",
  };
  const lower = char.toLowerCase();
  const nearby = keyboardMap[lower];
  if (!nearby) return char;
  return nearby[Math.floor(Math.random() * nearby.length)];
}

export function getHumanTypingSequence(text: string): TypingAction[] {
  const mistakeRate = 0.05;
  const wordPauseChance = 0.15;

  const result: TypingAction[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Simulate a mistake
    if (Math.random() < mistakeRate && /[a-zA-Z]/.test(char)) {
      const wrongChar = getRandomCharNear(char);
      result.push({
        char: wrongChar,
        delay: randomInRange(80, 200),
        action: "type",
      });
      result.push({
        char: "Backspace",
        delay: randomInRange(100, 200),
        action: "press",
      });
    }

    // Normal input
    const delay =
      char === " " && Math.random() < wordPauseChance
        ? randomInRange(300, 800)
        : randomInRange(100, 180);

    result.push({ char, delay: Math.floor(delay), action: "type" });
  }

  return result;
}

/** Keyboard keypress event */
export function getKeyboardPressDelay(): number {
  return Math.floor(randomInRange(80, 120));
}

export function getHumanKeypressSequence(keys: string[]): KeypressAction[] {
  const sequence = keys.map((key) => ({
    key,
    delay: Math.floor(randomInRange(80, 120)),
  }));
  return sequence;
}
