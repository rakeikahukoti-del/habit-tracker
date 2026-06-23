import { Stack } from "expo-router";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedStack />
    </ThemeProvider>
  );
}

function ThemedStack() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: {
          color: colors.text,
          fontSize: 18,
          fontWeight: "700",
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
      <Stack.Screen name="rank" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
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
  );
}
