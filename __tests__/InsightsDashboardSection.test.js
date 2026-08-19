import { fireEvent, renderWithProviders, screen } from "../test/test-utils";
import InsightsDashboardSection from "../components/analytics/InsightsDashboardSection";

// Covers the progressive-disclosure restructuring of Analytics' "Progress
// signals" section (Thread C, Analytics/Progress density survey -
// components/analytics/InsightsDashboardSection.js). Collapsed by default
// to just the overview card; insight cards, comparison cards, and habit
// ranking cards move behind a "See more" toggle that reuses
// WeeklyReviewCard's expand/collapse mechanism (state owned by the parent
// screen via useAnalyticsController, passed down as expanded/onToggle).
const dashboard = {
  consistency: {
    overall: { rate: 62 },
    last30Days: { rate: 74 },
    last90Days: { rate: 58 },
  },
  dashboardSections: [
    "overview",
    "insights",
    "weekly-comparison",
    "trends",
    "habit-rankings",
  ],
  habitRankings: {
    strongest: [
      { id: "h1", name: "Drink water", completionRate: 90, currentStreak: 12 },
    ],
    needsAttention: [
      { id: "h2", name: "Read", completionRate: 40, currentStreak: 0 },
    ],
  },
  insightCards: [
    {
      id: "strongest-habit",
      label: "Strongest habit",
      tone: "positive",
      body: "Drink water is your strongest habit over the last 30 days at 90%.",
    },
  ],
  monthlyComparison: {
    available: true,
    currentLabel: "August",
    direction: "improving",
    rate: 70,
    summary: "up from last month",
  },
  readiness: { message: "" },
  totals: { totalCompletions: 128, totalStreakDaysAccumulated: 45 },
  weeklyComparison: {
    available: true,
    currentLabel: "This week",
    direction: "stable",
    rate: 71,
    summary: "steady",
  },
};

describe("InsightsDashboardSection progressive disclosure", () => {
  test("collapsed by default: shows only the overview card, not cards/comparisons/rankings", async () => {
    renderWithProviders(
      <InsightsDashboardSection
        dashboard={dashboard}
        isSmallScreen={false}
        onToggle={jest.fn()}
      />
    );

    expect(await screen.findByText("74% consistency")).toBeTruthy();
    expect(screen.getByText("See more")).toBeTruthy();
    expect(
      screen.getByLabelText(
        "Show insight cards, comparisons, and habit rankings"
      )
    ).toBeTruthy();

    expect(screen.queryByText("Strongest habit")).toBeNull();
    expect(screen.queryByText("Drink water")).toBeNull();
    expect(screen.queryByText("Needs attention")).toBeNull();
  });

  test("expanded: reveals insight cards, comparison cards, and habit ranking cards", async () => {
    renderWithProviders(
      <InsightsDashboardSection
        dashboard={dashboard}
        expanded
        isSmallScreen={false}
        onToggle={jest.fn()}
      />
    );

    expect(await screen.findByText("See less")).toBeTruthy();
    expect(
      screen.getByLabelText(
        "Hide insight cards, comparisons, and habit rankings"
      )
    ).toBeTruthy();

    // Insight cards
    expect(screen.getByText("Strongest habit")).toBeTruthy();
    // Comparison cards
    expect(screen.getByText("This week")).toBeTruthy();
    expect(screen.getByText("This month")).toBeTruthy();
    // Habit ranking cards
    expect(screen.getByText("Drink water")).toBeTruthy();
    expect(screen.getByText("Needs attention")).toBeTruthy();

    // The overview card stays visible in both states, not just collapsed.
    expect(screen.getByText("74% consistency")).toBeTruthy();
  });

  test("pressing the toggle calls onToggle rather than managing its own state", async () => {
    const onToggle = jest.fn();

    renderWithProviders(
      <InsightsDashboardSection
        dashboard={dashboard}
        isSmallScreen={false}
        onToggle={onToggle}
      />
    );

    const toggle = await screen.findByLabelText(
      "Show insight cards, comparisons, and habit rankings"
    );

    fireEvent.press(toggle);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
