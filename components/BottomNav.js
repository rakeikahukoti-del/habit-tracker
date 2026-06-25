import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

const navItems = [
  { href: "/", key: "home", label: "Home" },
  { href: "/stats", key: "stats", label: "Stats" },
  { href: "/add", key: "add", label: "Add" },
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
      <View style={styles.nav}>
        {navItems.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          const isAdd = item.key === "add";

          return (
            <View key={item.key} style={styles.slot}>
              <Pressable
                accessibilityLabel={`${item.label}${active ? ", selected" : ""}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                hitSlop={{ bottom: 12, left: 10, right: 10, top: 12 }}
                onPress={() => {
                  if (!active) {
                    router.push(item.href);
                  }
                }}
                style={({ pressed }) => [
                  styles.item,
                  active && styles.itemActive,
                  isAdd && styles.addItem,
                  pressed && styles.itemPressed,
                ]}
              >
                <NavIcon
                  active={active}
                  colors={colors}
                  name={item.key}
                  styles={styles}
                />
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function NavIcon({ active, colors, name, styles }) {
  const iconColor = active ? colors.primary : colors.softText;

  if (name === "home") {
    return (
      <View style={styles.iconBox}>
        <View style={[styles.homeRoof, { borderColor: iconColor }]} />
        <View style={[styles.homeBody, { borderColor: iconColor }]} />
      </View>
    );
  }

  if (name === "stats") {
    return (
      <View style={[styles.iconBox, styles.chartBox]}>
        {[10, 16, 22].map((height, index) => (
          <View
            key={height}
            style={[
              styles.chartBar,
              {
                backgroundColor: iconColor,
                height,
                opacity: index === 0 && !active ? 0.72 : 1,
              },
            ]}
          />
        ))}
      </View>
    );
  }

  if (name === "add") {
    return (
      <View style={styles.iconBox}>
        <View style={[styles.plusLine, { backgroundColor: iconColor }]} />
        <View
          style={[
            styles.plusLine,
            styles.plusLineVertical,
            { backgroundColor: iconColor },
          ]}
        />
      </View>
    );
  }

  if (name === "rank") {
    return (
      <View style={styles.iconBox}>
        <View style={[styles.trophyCup, { borderColor: iconColor }]} />
        <View style={[styles.trophyStem, { backgroundColor: iconColor }]} />
        <View style={[styles.trophyBase, { backgroundColor: iconColor }]} />
      </View>
    );
  }

  return (
    <View style={styles.iconBox}>
      <View style={[styles.gearCircle, { borderColor: iconColor }]}>
        <View style={[styles.gearDot, { backgroundColor: iconColor }]} />
      </View>
      <View style={[styles.gearTick, { backgroundColor: iconColor }]} />
      <View
        style={[
          styles.gearTick,
          styles.gearTickHorizontal,
          { backgroundColor: iconColor },
        ]}
      />
    </View>
  );
}

function isActiveRoute(pathname, href) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/stats" && pathname === "/analytics") {
    return true;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function createStyles(colors, bottomInset) {
  return StyleSheet.create({
    wrapper: {
      alignSelf: "center",
      maxWidth: 760,
      paddingBottom: Math.max(10, bottomInset),
      paddingHorizontal: 12,
      paddingTop: 4,
      width: "100%",
      zIndex: 50,
    },
    nav: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 30,
      borderWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      minHeight: 76,
      paddingHorizontal: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.14,
      shadowRadius: 22,
      elevation: 12,
    },
    slot: {
      alignItems: "center",
      flex: 1,
      height: 76,
      justifyContent: "center",
      minWidth: 58,
    },
    item: {
      alignItems: "center",
      borderRadius: 24,
      height: 56,
      justifyContent: "center",
      minWidth: 56,
      transform: [{ scale: 1 }],
    },
    itemActive: {
      backgroundColor: colors.primarySoft,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
      elevation: 4,
      transform: [{ scale: 1.06 }],
    },
    itemPressed: {
      opacity: 0.82,
      transform: [{ scale: 0.96 }],
    },
    addItem: {
      height: 56,
      marginTop: 0,
      minWidth: 56,
    },
    iconBox: {
      alignItems: "center",
      height: 28,
      justifyContent: "center",
      position: "relative",
      width: 28,
    },
    homeRoof: {
      borderLeftWidth: 2.5,
      borderTopWidth: 2.5,
      height: 15,
      position: "absolute",
      top: 4,
      transform: [{ rotate: "45deg" }],
      width: 15,
    },
    homeBody: {
      borderBottomWidth: 2.5,
      borderLeftWidth: 2.5,
      borderRightWidth: 2.5,
      borderTopWidth: 0,
      borderRadius: 2,
      bottom: 4,
      height: 13,
      position: "absolute",
      width: 17,
    },
    chartBox: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: 4,
    },
    chartBar: {
      borderRadius: 999,
      width: 5,
    },
    plusLine: {
      borderRadius: 999,
      height: 4,
      position: "absolute",
      width: 26,
    },
    plusLineVertical: {
      transform: [{ rotate: "90deg" }],
    },
    trophyCup: {
      borderRadius: 6,
      borderWidth: 2.5,
      height: 15,
      top: 3,
      width: 19,
    },
    trophyStem: {
      borderRadius: 999,
      height: 8,
      marginTop: 2,
      width: 4,
    },
    trophyBase: {
      borderRadius: 999,
      height: 3,
      marginTop: 1,
      width: 16,
    },
    gearCircle: {
      alignItems: "center",
      borderRadius: 999,
      borderWidth: 2.5,
      height: 20,
      justifyContent: "center",
      width: 20,
    },
    gearDot: {
      borderRadius: 999,
      height: 5,
      width: 5,
    },
    gearTick: {
      borderRadius: 999,
      height: 28,
      opacity: 0.9,
      position: "absolute",
      width: 2.5,
    },
    gearTickHorizontal: {
      transform: [{ rotate: "90deg" }],
    },
  });
}
