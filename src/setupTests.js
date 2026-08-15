// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// --- jsdom shims so fabric.js can run headless in tests ---------------------
// jsdom implements neither a real 2d canvas context nor matchMedia. fabric
// needs measureText() to construct Textbox/IText (text wrapping), and the
// theme module reads matchMedia. Both are stubbed here — enough for state/logic
// tests; nothing pixel-accurate is asserted.

// A no-op 2d context whose measureText returns an approximate width, so
// fabric's text layout has numbers to work with.
const makeCtx = () =>
  new Proxy(
    { font: "" },
    {
      get(target, prop) {
        if (prop === "measureText") {
          return (str) => ({ width: String(str).length * 8 });
        }
        if (prop in target) return target[prop];
        // Every other canvas method fabric may call is a harmless no-op.
        return () => {};
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      },
    },
  );

if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = function getContext() {
    return makeCtx();
  };
}

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}
