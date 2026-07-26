import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppErrorBoundary from "../components/AppErrorBoundary";
import { MomentumLogo } from "../components/brand";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { v2Colors, v2FontWeight, v2Spacing } from "../src/design";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <ThemeProvider>
          <ThemedStack />
        </ThemeProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

function ThemedStack() {
  const { colors, themeLoaded } = useTheme();

  if (!themeLoaded) {
    return <LaunchShell />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.background} style="light" />
      <Stack
        screenOptions={{
          animation: "fade",
          animationDuration: 150,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTitleStyle: {
            color: colors.text,
            fontSize: 18,
            fontWeight: v2FontWeight.bold,
          },
          headerTintColor: colors.primary,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="add" options={{ headerShown: false }} />
        <Stack.Screen name="stats" options={{ headerShown: false }} />
        <Stack.Screen name="analytics" options={{ headerShown: false }} />
        <Stack.Screen name="analytics/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="rank" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="appearance" options={{ headerShown: false }} />
        <Stack.Screen name="habit-preferences" options={{ headerShown: false }} />
        <Stack.Screen name="reorder-habits" options={{ headerShown: false }} />
        <Stack.Screen
          name="notification-preferences"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="gamification-preferences"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="privacy" options={{ headerShown: false }} />
        <Stack.Screen name="terms" options={{ headerShown: false }} />
        <Stack.Screen name="disclaimer" options={{ headerShown: false }} />
        <Stack.Screen name="habit/[id]" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

function LaunchShell() {
  return (
    <View style={styles.launchShell}>
      <StatusBar backgroundColor={v2Colors.background} style="light" />
      <MomentumLogo
        color={v2Colors.textPrimary}
        cutoutColor={v2Colors.background}
        markSize={104}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  launchShell: {
    alignItems: "center",
    backgroundColor: v2Colors.background,
    flex: 1,
    gap: v2Spacing.xl,
    justifyContent: "center",
  },
});
