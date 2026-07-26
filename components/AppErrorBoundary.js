import { Component } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  spacing,
} from "../constants/typography";
import { v2Colors } from "../src/design";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (__DEV__) {
      // Keep technical details in development without exposing them in-app.
      console.error(error);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Momentum</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            Your habit data is still stored locally. Try reopening this screen.
          </Text>
          <Pressable
            accessibilityLabel="Try again"
            accessibilityRole="button"
            onPress={this.handleRetry}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: v2Colors.background,
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: v2Colors.surfaceElevated,
    borderColor: v2Colors.borderDefault,
    borderRadius: radius.lg,
    borderWidth: 1,
    maxWidth: 380,
    padding: spacing.xxl,
    width: "100%",
  },
  eyebrow: {
    color: v2Colors.textSecondary,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  title: {
    color: v2Colors.textPrimary,
    fontSize: fontSize.section,
    fontWeight: fontWeight.bold,
    lineHeight: 24,
  },
  body: {
    color: v2Colors.textSecondary,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    marginTop: spacing.sm,
  },
  button: {
    alignItems: "center",
    backgroundColor: v2Colors.accentPrimary,
    borderRadius: radius.md,
    justifyContent: "center",
    marginTop: spacing.xl,
    minHeight: 48,
  },
  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: v2Colors.accentContrast,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
});
