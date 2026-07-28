import BrandLogo from "../BrandLogo";
import { v2Colors } from "../../src/design";

export default function MomentumWolfMark({
  color = v2Colors.textPrimary,
  cutoutColor = v2Colors.background,
  decorative = false,
  size = 96,
  style,
}) {
  const variant = shouldUseBlackLogo(color, cutoutColor) ? "light" : "dark";

  return (
    <BrandLogo
      accessibilityLabel="Momentum wolf logo"
      decorative={decorative}
      size={size}
      style={style}
      variant={variant}
    />
  );
}

function shouldUseBlackLogo(color, cutoutColor) {
  const surfaceColor = normalizeHex(cutoutColor);
  const markColor = normalizeHex(color);

  if (markColor) {
    return getLuminance(markColor) < 0.45;
  }

  return surfaceColor ? getLuminance(surfaceColor) > 0.65 : false;
}

function normalizeHex(value) {
  if (typeof value !== "string" || !value.startsWith("#")) {
    return null;
  }

  const hex = value.replace("#", "");

  if (hex.length !== 6) {
    return null;
  }

  return hex;
}

function getLuminance(hex) {
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);

  return (red * 299 + green * 587 + blue * 114) / 255000;
}
