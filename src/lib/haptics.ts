export function haptic(pattern: "light" | "medium" | "success" | "warning" = "light") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  const patterns = {
    light: 10,
    medium: 20,
    success: [10, 30, 10],
    warning: [20, 50, 20],
  };
  navigator.vibrate(patterns[pattern]);
}
