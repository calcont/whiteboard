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
