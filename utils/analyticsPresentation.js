function clampPercentage(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function getMetricAccessibilityLabel(label, value, helper = "") {
  const detail = helper ? `. ${helper}` : "";
  return `${label}: ${value}${detail}`;
}

export function getTrendAccessibilitySummary(points, periodLabel = "period") {
  const safePoints = Array.isArray(points)
    ? points.filter(
        (point) =>
          point &&
          typeof point.label === "string" &&
          Number.isFinite(point.percentage)
      )
    : [];

  if (safePoints.length === 0) {
    return "No trend data available yet.";
  }

  const percentages = safePoints.map((point) =>
    clampPercentage(point.percentage)
  );
  const latestPoint = safePoints[safePoints.length - 1];
  const recentPoints = safePoints
    .slice(-4)
    .map(
      (point) =>
        `${point.label} ${clampPercentage(point.percentage)} percent`
    )
    .join(", ");

  return `Completion trend ranges from ${Math.min(
    ...percentages
  )} percent to ${Math.max(
    ...percentages
  )} percent over ${periodLabel.toLowerCase()}. Latest: ${
    latestPoint.label
  } at ${clampPercentage(
    latestPoint.percentage
  )} percent. Recent points: ${recentPoints}.`;
}

export function getHabitPerformanceAccessibilityLabel(item, trendLabel) {
  const name = item?.habit?.name || "Habit";
  const completionRate = clampPercentage(item?.completionRate);
  const currentStreak = Number.isFinite(item?.currentStreak)
    ? Math.max(0, Math.round(item.currentStreak))
    : 0;

  return `Open analytics for ${name}. ${completionRate} percent completion. ${currentStreak} day streak. ${trendLabel}.`;
}
