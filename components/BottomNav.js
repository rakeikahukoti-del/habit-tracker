import * as Haptics from "expo-haptics";
import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import {
  v2FontWeight,
  v2Layout,
  v2Radius,
  v2Typography,
} from "../src/design";
import { AppText } from "./ui";

const navItems = [
  { href: "/", key: "today", label: "Today" },
  { href: "/stats", key: "progress", label: "Progress" },
  { href: "/analytics", key: "analytics", label: "Analytics" },
  { href: "/rank", key: "rank", label: "Rank" },
  { href: "/settings", key: "settings", label: "Settings" },
];

export default function BottomNav() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const styles = createStyles(colors, insets.bottom);

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View accessibilityRole="tablist" style={styles.nav}>
        {navItems.map((item) => {
          const active = isActiveRoute(pathname, item.href);

          return (
            <Pressable
              accessibilityLabel={`${item.label}${active ? ", selected" : ""}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              android_ripple={{ color: colors.primarySoft, borderless: false }}
              hitSlop={{ bottom: 8, left: 4, right: 4, top: 8 }}
              key={item.key}
              onPress={() => {
                if (!active) {
                  triggerNavigationFeedback();
                  router.push(item.href);
                }
              }}
              style={({ pressed }) => [
                styles.item,
                active && styles.itemActive,
                pressed && styles.itemPressed,
              ]}
            >
              <View
                style={[styles.indicator, active && styles.indicatorActive]}
              />
              <NavIcon
                active={active}
                colors={colors}
                name={item.key}
                styles={styles}
              />
              <AppText
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1.2}
                minimumFontScale={0.86}
                numberOfLines={1}
                style={[styles.label, active && styles.labelActive]}
              >
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function NavIcon({ active, colors, name, styles }) {
  const iconColor = active ? colors.text : colors.softText;
  const stroke = active ? styles.strokeActive : styles.stroke;

  if (name === "today") {
    return (
      <View style={styles.iconBox}>
        <View style={[styles.calendar, stroke, { borderColor: iconColor }]}>
          <View style={[styles.calendarLine, { backgroundColor: iconColor }]} />
          <View style={[styles.calendarDot, { backgroundColor: iconColor }]} />
        </View>
      </View>
    );
  }

  if (name === "progress") {
    return (
      <View style={[styles.iconBox, styles.progressIcon]}>
        {[8, 14, 20].map((height) => (
          <View
            key={height}
            style={[styles.bar, { backgroundColor: iconColor, height }]}
          />
        ))}
      </View>
    );
  }

  if (name === "analytics") {
    return (
      <View style={styles.iconBox}>
        <View style={[styles.axisVertical, { backgroundColor: iconColor }]} />
        <View style={[styles.axisHorizontal, { backgroundColor: iconColor }]} />
        <View style={[styles.trendA, { backgroundColor: iconColor }]} />
        <View style={[styles.trendB, { backgroundColor: iconColor }]} />
      </View>
    );
  }

  if (name === "rank") {
    return (
      <View style={styles.iconBox}>
        <View style={[styles.trophyCup, stroke, { borderColor: iconColor }]} />
        <View style={[styles.trophyStem, { backgroundColor: iconColor }]} />
        <View style={[styles.trophyBase, { backgroundColor: iconColor }]} />
      </View>
    );
  }

  return (
    <View style={styles.iconBox}>
      <View style={[styles.gearOuter, stroke, { borderColor: iconColor }]}>
        <View style={[styles.gearInner, { backgroundColor: iconColor }]} />
      </View>
      <View style={[styles.gearTick, { backgroundColor: iconColor }]} />
      <View
        style={[
          styles.gearTick,
          styles.gearTickCross,
          { backgroundColor: iconColor },
        ]}
      />
    </View>
  );
}

function triggerNavigationFeedback() {
  Haptics.selectionAsync().catch(() => {
    // Haptics are optional shell feedback and should never affect navigation.
  });
}

function isActiveRoute(pathname, href) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function createStyles(colors, bottomInset) {
  const bottomPadding = Math.max(10, bottomInset);

  return StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background,
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingBottom: bottomPadding,
      paddingHorizontal: 8,
      paddingTop: 6,
      width: "100%",
      zIndex: 50,
    },
    nav: {
      alignSelf: "center",
      backgroundColor: colors.background,
      flexDirection: "row",
      justifyContent: "space-between",
      maxWidth: 760,
      minHeight: 64,
      width: "100%",
    },
    item: {
      alignItems: "center",
      borderRadius: v2Radius.large,
      flex: 1,
      gap: 3,
      justifyContent: "center",
      minHeight: 58,
      minWidth: v2Layout.minTapTarget,
      paddingHorizontal: 2,
      transform: [{ scale: 1 }],
    },
    itemActive: {
      backgroundColor: colors.surface,
    },
    itemPressed: {
      opacity: 0.72,
      transform: [{ scale: 0.98 }],
    },
    indicator: {
      backgroundColor: colors.border,
      borderRadius: v2Radius.pill,
      height: 2,
      marginBottom: 3,
      opacity: 0,
      width: 18,
    },
    indicatorActive: {
      backgroundColor: colors.text,
      opacity: 1,
    },
    label: {
      color: colors.softText,
      fontSize: v2Typography.navigationLabel.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.navigationLabel.lineHeight,
      textAlign: "center",
    },
    labelActive: {
      color: colors.text,
      fontWeight: v2FontWeight.bold,
    },
    iconBox: {
      alignItems: "center",
      height: 24,
      justifyContent: "center",
      position: "relative",
      width: 24,
    },
    stroke: {
      borderWidth: 1.8,
    },
    strokeActive: {
      borderWidth: 2.2,
    },
    calendar: {
      borderRadius: 4,
      height: 19,
      overflow: "hidden",
      width: 18,
    },
    calendarLine: {
      height: 2,
      left: 0,
      opacity: 0.9,
      position: "absolute",
      right: 0,
      top: 5,
    },
    calendarDot: {
      borderRadius: v2Radius.pill,
      bottom: 4,
      height: 4,
      position: "absolute",
      right: 4,
      width: 4,
    },
    progressIcon: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: 3,
    },
    bar: {
      borderRadius: 999,
      width: 4,
    },
    axisVertical: {
      borderRadius: v2Radius.pill,
      bottom: 4,
      height: 17,
      left: 4,
      position: "absolute",
      width: 2,
    },
    axisHorizontal: {
      borderRadius: v2Radius.pill,
      bottom: 4,
      height: 2,
      left: 4,
      position: "absolute",
      width: 17,
    },
    trendA: {
      borderRadius: v2Radius.pill,
      height: 2,
      left: 8,
      position: "absolute",
      top: 13,
      transform: [{ rotate: "-28deg" }],
      width: 8,
    },
    trendB: {
      borderRadius: v2Radius.pill,
      height: 2,
      position: "absolute",
      right: 4,
      top: 9,
      transform: [{ rotate: "32deg" }],
      width: 8,
    },
    trophyCup: {
      borderRadius: 5,
      height: 13,
      top: 2,
      width: 17,
    },
    trophyStem: {
      borderRadius: v2Radius.pill,
      height: 6,
      marginTop: 3,
      width: 3,
    },
    trophyBase: {
      borderRadius: v2Radius.pill,
      height: 2,
      marginTop: 1,
      width: 14,
    },
    gearOuter: {
      alignItems: "center",
      borderRadius: v2Radius.pill,
      height: 17,
      justifyContent: "center",
      width: 17,
    },
    gearInner: {
      borderRadius: v2Radius.pill,
      height: 4,
      width: 4,
    },
    gearTick: {
      borderRadius: v2Radius.pill,
      height: 23,
      opacity: 0.86,
      position: "absolute",
      width: 2,
    },
    gearTickCross: {
      transform: [{ rotate: "90deg" }],
    },
  });
}
