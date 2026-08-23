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

  test("keeps a current preset (28) untouched", () => {
    localStorage.setItem("wb-style", JSON.stringify({ fontSize: 28, _v: 4 }));
    expect(getStoredStyle().fontSize).toBe(28);
  });
});

describe("getStoredStyle — off-preset sizes snap to the nearest preset", () => {
  // Legacy sizes from an older S/M/L scale are no longer presets, which left the
  // Size control blank; snapping keeps a preset always active. Presets: 16/20/28.
  test("legacy 12 (old S) snaps to 16", () => {
    localStorage.setItem("wb-style", JSON.stringify({ fontSize: 12, _v: 4 }));
    expect(getStoredStyle().fontSize).toBe(16);
  });

  test("legacy 36 (old L) snaps to 28", () => {
    localStorage.setItem("wb-style", JSON.stringify({ fontSize: 36, _v: 4 }));
    expect(getStoredStyle().fontSize).toBe(28);
  });

  test("an exact preset is left alone", () => {
    localStorage.setItem("wb-style", JSON.stringify({ fontSize: 16, _v: 4 }));
    expect(getStoredStyle().fontSize).toBe(16);
  });
});

describe("getStoredStyle — stroke width snaps to the nearest preset", () => {
  // Presets: 2/3/6. The default (3) is a preset so the Width control highlights.
  test("default strokeWidth (3) is a preset and is kept", () => {
    expect(getStoredStyle().strokeWidth).toBe(3);
    expect(DEFAULT_STYLE.strokeWidth).toBe(3);
  });

  test("a legacy width (8) snaps to the nearest preset (6)", () => {
    localStorage.setItem("wb-style", JSON.stringify({ strokeWidth: 8, _v: 4 }));
    expect(getStoredStyle().strokeWidth).toBe(6);
  });
});
