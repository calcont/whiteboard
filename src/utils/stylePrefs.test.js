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

describe("getStoredStyle — v4 font-size migration", () => {
  test("default is 20px", () => {
    expect(getStoredStyle().fontSize).toBe(20);
    expect(DEFAULT_STYLE.fontSize).toBe(20);
  });

  test("bumps a superseded default (24, pre-v4) up to 20", () => {
    localStorage.setItem("wb-style", JSON.stringify({ fontSize: 24, _v: 2 }));
    expect(getStoredStyle().fontSize).toBe(20);
  });

  test("bumps the v3 default (16) up to 20", () => {
    localStorage.setItem("wb-style", JSON.stringify({ fontSize: 16, _v: 3 }));
    expect(getStoredStyle().fontSize).toBe(20);
  });

  test("keeps a deliberately-picked size (e.g. 28) chosen at v4", () => {
    localStorage.setItem("wb-style", JSON.stringify({ fontSize: 28, _v: 4 }));
    expect(getStoredStyle().fontSize).toBe(28);
  });

  test("never touches a non-default stored size", () => {
    localStorage.setItem("wb-style", JSON.stringify({ fontSize: 36, _v: 2 }));
    expect(getStoredStyle().fontSize).toBe(36);
  });
});
