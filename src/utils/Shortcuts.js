// Accept Cmd (metaKey) as well as Ctrl so the shortcuts work on macOS too.
const isMod = (e) => e.ctrlKey || e.metaKey;

export const isCtrlZ = (e) => {
  return isMod(e) && !e.shiftKey && e.code === "KeyZ";
};
export const isCtrlShiftZ = (e) => {
  return isMod(e) && e.shiftKey && e.code === "KeyZ";
};

export const isCtrlD = (e) => {
  return isMod(e) && !e.shiftKey && e.code === "KeyD";
};

export const isCtrlC = (e) => {
  return isMod(e) && !e.shiftKey && e.code === "KeyC";
};

export const isCtrlV = (e) => {
  return isMod(e) && !e.shiftKey && e.code === "KeyV";
};

export const isCtrlA = (e) => {
  return isMod(e) && !e.shiftKey && e.code === "KeyA";
};

export const isCtrlPlus = (e) => {
  return isMod(e) && !e.shiftKey && e.code === "Equal";
};

export const isCtrlMinus = (e) => {
  return isMod(e) && !e.shiftKey && e.code === "Minus";
};

export const isArrow = (e) => {
  return ["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp"].includes(e.code);
};
