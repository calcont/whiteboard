import {
  DEFAULT_STYLE,
  strokeDashArrayFor,
  toFabricStyle,
  toTextStyle,
} from "./toolStyle";

describe("strokeDashArrayFor", () => {
  test("solid has no dash array", () => {
    expect(strokeDashArrayFor("solid", 2)).toBeNull();
  });
  test("dashed and dotted produce dash arrays that scale with width", () => {
    expect(Array.isArray(strokeDashArrayFor("dashed", 2))).toBe(true);
    expect(Array.isArray(strokeDashArrayFor("dotted", 2))).toBe(true);
    expect(strokeDashArrayFor("dotted", 4)).not.toEqual(
      strokeDashArrayFor("dotted", 2),
    );
  });
});

describe("toFabricStyle", () => {
  test("keeps stroke uniform and caching off so borders stay crisp while scaling", () => {
    const fab = toFabricStyle(DEFAULT_STYLE);
    expect(fab.strokeUniform).toBe(true);
    expect(fab.objectCaching).toBe(false);
    expect(fab.stroke).toBe(DEFAULT_STYLE.stroke);
  });
});

describe("toTextStyle", () => {
  test("text colour is driven by the stroke swatch", () => {
    const ts = toTextStyle({ ...DEFAULT_STYLE, stroke: "#123456" });
    expect(ts.fill).toBe("#123456");
    expect(ts.fontFamily).toBe(DEFAULT_STYLE.fontFamily);
  });
});

test("default font is Comic Sans MS", () => {
  expect(DEFAULT_STYLE.fontFamily).toBe("Comic Sans MS");
});
