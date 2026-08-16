import { dimColor } from "./themeColor";
import { fabric } from "fabric";

const hslOf = (c) => {
  const [r, g, b] = new fabric.Color(c).getSource();
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  let h = 0;
  if (max !== min) {
    const d = max - min;
    if (max === rr) h = (gg - bb) / d + (gg < bb ? 6 : 0);
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h /= 6;
  }
  return { h, l };
};

test("dims a bright fill to a dark tone of the same hue", () => {
  const before = hslOf("#a5d8ff"); // bright light blue, L ~0.82
  const after = hslOf(dimColor("#a5d8ff"));
  expect(after.l).toBeLessThan(0.35); // now dark
  expect(Math.abs(after.h - before.h)).toBeLessThan(0.02); // hue preserved
});

test("is its own inverse (theme toggle round-trips the colour)", () => {
  const orig = hslOf("#a5d8ff");
  const round = hslOf(dimColor(dimColor("#a5d8ff")));
  expect(Math.abs(round.l - orig.l)).toBeLessThan(0.02);
  expect(Math.abs(round.h - orig.h)).toBeLessThan(0.02);
});

test("passes through empty / no-fill values untouched", () => {
  expect(dimColor("transparent")).toBe("transparent");
  expect(dimColor("")).toBe("");
  expect(dimColor(null)).toBe(null);
  expect(dimColor("none")).toBe("none");
});
