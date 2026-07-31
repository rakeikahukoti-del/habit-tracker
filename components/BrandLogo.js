import { Image, StyleSheet, View } from "react-native";
import { getBrandLogoAsset } from "../constants/assets";
import { useTheme } from "../context/ThemeContext";

export default function BrandLogo({
  accessibilityLabel = "Momentum logo",
  decorative = false,
  size = 96,
  style,
}) {
  const { resolvedTheme, themeLoaded } = useTheme();
  const source = getBrandLogoAsset(resolvedTheme);
  const resolvedSize = Number.isFinite(size) && size > 0 ? size : 96;

  return (
    <View
      accessibilityLabel={decorative ? undefined : accessibilityLabel}
      accessibilityRole={decorative ? undefined : "image"}
      accessible={!decorative}
      importantForAccessibility={decorative ? "no" : "auto"}
      style={[
        styles.wrap,
        { height: resolvedSize, width: resolvedSize },
        style,
      ]}
    >
      {themeLoaded ? (
        <Image
          accessibilityIgnoresInvertColors
          accessible={false}
          resizeMode="contain"
          source={source}
          style={styles.image}
        />
      ) : null}
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
