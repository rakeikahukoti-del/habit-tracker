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

    return (
      <View style={styles.screen}>
        <View style={styles.card}>
          <AppText style={styles.eyebrow}>Momentum</AppText>
          <AppText style={styles.title}>Something went wrong</AppText>
          <AppText style={styles.body}>
            Your habit data is still stored locally. Try reopening this screen.
          </AppText>
          <PressableScale
            accessibilityLabel="Try again"
            accessibilityRole="button"
            onPress={this.handleRetry}
            style={styles.button}
          >
            <AppText style={styles.buttonText}>Try again</AppText>
          </PressableScale>
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
    borderRadius: v2Radius.large,
    borderWidth: 1,
    maxWidth: 380,
    padding: v2Spacing.xxl,
    width: "100%",
    ...v2Shadows.low,
  },
  eyebrow: {
    color: v2Colors.textSecondary,
    fontSize: v2Typography.caption.fontSize,
    fontWeight: v2FontWeight.bold,
    letterSpacing: 0.6,
    marginBottom: v2Spacing.sm,
    textTransform: "uppercase",
  },
  title: {
    color: v2Colors.textPrimary,
    fontSize: v2Typography.sectionTitle.fontSize,
    fontWeight: v2FontWeight.bold,
    lineHeight: v2Typography.sectionTitle.lineHeight,
  },
  body: {
    color: v2Colors.textSecondary,
    fontSize: v2Typography.body.fontSize,
    lineHeight: v2Typography.body.lineHeight,
    marginTop: v2Spacing.sm,
  },
  button: {
    alignItems: "center",
    backgroundColor: v2Colors.accentPrimary,
    borderRadius: v2Radius.medium,
    justifyContent: "center",
    marginTop: v2Spacing.xl,
    minHeight: 48,
  },
  buttonText: {
    color: v2Colors.accentContrast,
    fontSize: v2Typography.button.fontSize,
    fontWeight: v2FontWeight.bold,
  },
});
