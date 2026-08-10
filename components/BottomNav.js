import { useEffect, useMemo, useRef } from "react";
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
import { AppIcon, AppText } from "./ui";

const navItems = [
  { href: "/", icon: "home", key: "today", label: "Today" },
  { href: "/stats", icon: "progress", key: "progress", label: "Progress" },
  { href: "/analytics", icon: "analytics", key: "analytics", label: "Analytics" },
  { href: "/rank", icon: "rank", key: "rank", label: "Rank" },
  { href: "/settings", icon: "settings", key: "settings", label: "Settings" },
];

export default function BottomNav() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const navigationTimeoutRef = useRef(null);
  const pendingHrefRef = useRef(null);
  const styles = useMemo(
    () => createStyles(colors, insets),
    [colors, insets]
  );

  useEffect(() => {
    pendingHrefRef.current = null;

    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
  }, [pathname]);

  useEffect(
    () => () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    },
    []
  );

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View accessibilityRole="tablist" style={styles.nav}>
        {navItems.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          const iconColor = active ? colors.text : colors.softText;

          return (
            <Pressable
              accessibilityLabel={`${item.label}${active ? ", selected" : ""}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              android_ripple={{ color: colors.primarySoft, borderless: false }}
              hitSlop={{ bottom: 8, left: 4, right: 4, top: 8 }}
              key={item.key}
              onPress={() => {
                if (active || pendingHrefRef.current === item.href) {
                  return;
                }

                pendingHrefRef.current = item.href;
                triggerNavigationFeedback();
                router.push(item.href);

                if (navigationTimeoutRef.current) {
                  clearTimeout(navigationTimeoutRef.current);
                }

                navigationTimeoutRef.current = setTimeout(() => {
                  pendingHrefRef.current = null;
                  navigationTimeoutRef.current = null;
                }, 450);
              }}
              style={({ pressed }) => [
                styles.item,
                active && styles.itemActive,
                pressed && styles.itemPressed,
              ]}
            >
              <View style={[styles.indicator, active && styles.indicatorActive]} />
              <AppIcon
                color={iconColor}
                name={item.icon}
                size={23}
                strokeWidth={active ? 2.2 : 1.9}
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

function createStyles(colors, insets) {
  const bottomPadding = Math.max(10, insets.bottom);
  // In landscape on notched iPhones, the home-indicator safe area moves to
  // the side (left or right, depending on landscape-left vs
  // landscape-right) instead of the bottom - insets.left/right pick that up
  // so the outer two nav items don't sit under it. Portrait leaves both at
  // 0, so this is a no-op there.
  const horizontalPadding = {
    paddingLeft: Math.max(8, insets.left),
    paddingRight: Math.max(8, insets.right),
  };

  return StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background,
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingBottom: bottomPadding,
      ...horizontalPadding,
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
  });
}
