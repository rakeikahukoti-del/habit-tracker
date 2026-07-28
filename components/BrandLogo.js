import { Image, StyleSheet, View } from "react-native";
import { BRAND_ASSETS } from "../constants/assets";

export default function BrandLogo({
  accessibilityLabel = "Momentum logo",
  decorative = false,
  size = 96,
  style,
  variant = "dark",
}) {
  const source =
    variant === "light" ? BRAND_ASSETS.appIconLight : BRAND_ASSETS.appIconDark;

  return (
    <View
      accessibilityLabel={decorative ? undefined : accessibilityLabel}
      accessibilityRole={decorative ? undefined : "image"}
      accessible={!decorative}
      importantForAccessibility={decorative ? "no" : "auto"}
      style={[styles.wrap, { height: size, width: size }, style]}
    >
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={source}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    height: "100%",
    width: "100%",
  },
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
