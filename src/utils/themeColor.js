import { fabric } from "fabric";

// Dark-mode colour adaptation. A bright fill authored for the light board looks
// harsh on the near-black dark board, so in dark mode we DIM it (excalidraw
// softens colours the same way). The transform inverts HSL *lightness* while
// keeping hue + saturation, so a bright pastel becomes a muted deep tone of the
// same colour. It is its own inverse (L -> 1-L -> 1-(1-L) = L), so toggling the
// theme just re-applies it — no need to stash the original colour anywhere
// (which also keeps it reload-safe: the stored colour always matches the stored
// theme). Full-colour imported logos are deliberately left untouched by the
// callers of this module.

const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h, s, l];
};

const hue2rgb = (p, q, t) => {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
};

const hslToRgb = (h, s, l) => {
  let r;
  let g;
  let b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

const EMPTY = new Set(["", "transparent", "none"]);

// Invert a colour's lightness (self-inverse). Passes through empty/no-fill
// values and anything unparseable.
export const dimColor = (color) => {
  if (!color || EMPTY.has(color)) return color;
  let src;
  try {
    src = new fabric.Color(color).getSource(); // [r, g, b, a]
  } catch {
    return color;
  }
  if (!src) return color;
  const [h, s, l] = rgbToHsl(src[0], src[1], src[2]);
  const [r, g, b] = hslToRgb(h, s, 1 - l);
  const a = src[3];
  return a == null || a === 1
    ? `rgb(${r}, ${g}, ${b})`
    : `rgba(${r}, ${g}, ${b}, ${a})`;
};

export const isDarkTheme = () =>
  typeof document !== "undefined" &&
  document.documentElement.getAttribute("data-theme") === "dark";
