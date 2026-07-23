/**
 * Converts a six-character hex color into an rgba() string.
 * Returns the original value if the input is not a supported hex color.
 */
export function withAlpha(hexColor, alpha) {
  if (typeof hexColor !== "string") {
    return hexColor;
  }

  const normalized = hexColor.replace("#", "");

  if (normalized.length !== 6) {
    return hexColor;
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return hexColor;
  }

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
