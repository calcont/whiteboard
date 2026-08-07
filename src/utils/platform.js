// Detect macOS so keyboard shortcuts can use the Cmd (⌘) modifier and label
// instead of Ctrl, matching platform conventions.
export const isMacOS = () => {
  if (typeof navigator === "undefined") return false;
  const platform =
    navigator.userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent ||
    "";
  return /mac/i.test(platform);
};
