import { getStoredStyle, saveStyle } from "./stylePrefs";
import { DEFAULT_STYLE } from "../Handlers/ToolsHandler/toolStyle";

beforeEach(() => localStorage.clear());

describe("getStoredStyle", () => {
  test("with nothing stored, uses the current default font (Comic Sans MS)", () => {
    expect(getStoredStyle().fontFamily).toBe(DEFAULT_STYLE.fontFamily);
    expect(DEFAULT_STYLE.fontFamily).toBe("Comic Sans MS");
  });

  test("migrates an old, unversioned Arial style to the new default", () => {
    localStorage.setItem(
      "wb-style",
      JSON.stringify({ fontFamily: "Arial", strokeWidth: 3 }),
    );
    const s = getStoredStyle();
    expect(s.fontFamily).toBe("Comic Sans MS");
    expect(s.strokeWidth).toBe(3); // other prefs preserved
  });

  test("keeps a deliberate Arial chosen after the migration (versioned)", () => {
    localStorage.setItem(
      "wb-style",
      JSON.stringify({ fontFamily: "Arial", _v: 2 }),
    );
    expect(getStoredStyle().fontFamily).toBe("Arial");
  });

  test("keeps any non-default stored font", () => {
    localStorage.setItem("wb-style", JSON.stringify({ fontFamily: "Georgia" }));
    expect(getStoredStyle().fontFamily).toBe("Georgia");
  });

  test("round-trips through saveStyle", () => {
    saveStyle({ ...DEFAULT_STYLE, fontFamily: "Verdana" });
    expect(getStoredStyle().fontFamily).toBe("Verdana");
  });
});

describe("getStoredStyle — v3 font-size migration", () => {
  test("default is the shrunk 16px", () => {
    expect(getStoredStyle().fontSize).toBe(16);
    expect(DEFAULT_STYLE.fontSize).toBe(16);
  });

  test("bumps a pre-v3 style still on the old 24px default down to 16", () => {
    localStorage.setItem("wb-style", JSON.stringify({ fontSize: 24, _v: 2 }));
    expect(getStoredStyle().fontSize).toBe(16);
  });

  test("keeps a deliberately-picked size (e.g. 24) chosen at v3", () => {
    localStorage.setItem("wb-style", JSON.stringify({ fontSize: 24, _v: 3 }));
    expect(getStoredStyle().fontSize).toBe(24);
  });

  test("never touches a non-24 stored size", () => {
    localStorage.setItem("wb-style", JSON.stringify({ fontSize: 36, _v: 2 }));
    expect(getStoredStyle().fontSize).toBe(36);
  });
});
