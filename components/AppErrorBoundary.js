import { Component } from "react";
import { StyleSheet, View } from "react-native";
import {
  v2Colors,
  v2FontWeight,
  v2Radius,
  v2Shadows,
  v2Spacing,
  v2Typography,
} from "../src/design";
import { AppText, PressableScale } from "./ui";

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

    const colors = this.props.colors || {
      background: v2Colors.background,
      border: v2Colors.borderDefault,
      card: v2Colors.surfaceElevated,
      inverseText: v2Colors.accentContrast,
      muted: v2Colors.textSecondary,
      primary: v2Colors.accentPrimary,
      text: v2Colors.textPrimary,
    };

    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <AppText style={[styles.eyebrow, { color: colors.muted }]}>
            Momentum
          </AppText>
          <AppText style={[styles.title, { color: colors.text }]}>
            Something went wrong
          </AppText>
          <AppText style={[styles.body, { color: colors.muted }]}>
            Your habit data is still stored locally. Try reopening this screen.
          </AppText>
          <PressableScale
            accessibilityLabel="Try again"
            accessibilityRole="button"
            onPress={this.handleRetry}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            <AppText
              style={[styles.buttonText, { color: colors.inverseText }]}
            >
              Try again
            </AppText>
          </PressableScale>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: v2Radius.large,
    borderWidth: 1,
    maxWidth: 380,
    padding: v2Spacing.xxl,
    width: "100%",
    ...v2Shadows.low,
  },
  eyebrow: {
    fontSize: v2Typography.caption.fontSize,
    fontWeight: v2FontWeight.bold,
    letterSpacing: 0.6,
    marginBottom: v2Spacing.sm,
    textTransform: "uppercase",
  },
  title: {
    fontSize: v2Typography.sectionTitle.fontSize,
    fontWeight: v2FontWeight.bold,
    lineHeight: v2Typography.sectionTitle.lineHeight,
  },
  body: {
    fontSize: v2Typography.body.fontSize,
    lineHeight: v2Typography.body.lineHeight,
    marginTop: v2Spacing.sm,
  },
  button: {
    alignItems: "center",
    borderRadius: v2Radius.medium,
    justifyContent: "center",
    marginTop: v2Spacing.xl,
    minHeight: 48,
  },
  buttonText: {
    fontSize: v2Typography.button.fontSize,
    fontWeight: v2FontWeight.bold,
  },
});
