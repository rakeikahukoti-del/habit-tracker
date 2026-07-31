import BrandLogo from "../BrandLogo";

export default function MomentumWolfMark({
  accessibilityLabel = "Momentum wolf logo",
  decorative = false,
  size = 96,
  style,
}) {
  return (
    <BrandLogo
      accessibilityLabel={accessibilityLabel}
      decorative={decorative}
      size={size}
      style={style}
    />
  );
}
