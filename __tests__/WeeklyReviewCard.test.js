import { renderWithProviders, screen } from "../test/test-utils";
import WeeklyReviewCard from "../components/stats/WeeklyReviewCard";

// Covers the dot row folded in from the standalone WeeklyVisual component
// (Thread C, Analytics/Progress density survey - components/stats/
// WeeklyReviewCard.js). The row uses the same rolling-7-day shape
// WeeklyVisual always consumed (label, dateKey, completedCount,
// totalHabits), now passed in as WeeklyReviewCard's `days` prop instead of
// review's own (differently-shaped, differently-dated) `days` field.
const review = {
  activeDaysLabel: "3 active days",
  bestHabit: null,
  breakdown: [
    { completedCount: 7, id: "h1", name: "Drink water", possibleCount: 7, status: "Complete (last 7 days)" },
  ],
  comparison: { available: true, label: "+5% vs last week" },
  completedCount: 10,
  completionRateLabel: "71%",
  context: "Keep completing habits to build this week's summary.",
  dateRange: "3 Aug - 9 Aug",
  focusHabit: null,
  missedCount: 4,
  possibleCount: 14,
  summaryLabel: "10 of 14",
};

const days = [
  { completedCount: 2, dateKey: "2026-08-10", label: "M", totalHabits: 3 },
  { completedCount: 0, dateKey: "2026-08-11", label: "T", totalHabits: 2 },
  { completedCount: 3, dateKey: "2026-08-12", label: "W", totalHabits: 3 },
  { completedCount: 1, dateKey: "2026-08-13", label: "T", totalHabits: 4 },
  { completedCount: 0, dateKey: "2026-08-14", label: "F", totalHabits: 0 },
  { completedCount: 2, dateKey: "2026-08-15", label: "S", totalHabits: 2 },
  { completedCount: 1, dateKey: "2026-08-16", label: "S", totalHabits: 3 },
];

describe("WeeklyReviewCard dot row", () => {
  test("renders all 7 days, visible without expanding the card", async () => {
    renderWithProviders(
      <WeeklyReviewCard
        days={days}
        expanded={false}
        isSmallScreen={false}
        onToggle={jest.fn()}
        review={review}
      />
    );

    // findBy* (rather than getBy*) lets ThemeProvider's async AsyncStorage
    // read settle before the first assertion - see test/test-utils.js and
    // RankBadge.test.js for the same convention.
    expect(await screen.findByLabelText("M: 2 of 3 completed")).toBeTruthy();

    // One accessibility label per day, each distinct by its completed/total
    // counts - proves all 7 render, not just a subset.
    expect(screen.getByLabelText("T: 0 of 2 completed")).toBeTruthy();
    expect(screen.getByLabelText("W: 3 of 3 completed")).toBeTruthy();
    expect(screen.getByLabelText("T: 1 of 4 completed")).toBeTruthy();
    expect(screen.getByLabelText("F: 0 of 0 completed")).toBeTruthy();
    expect(screen.getByLabelText("S: 2 of 2 completed")).toBeTruthy();
    expect(screen.getByLabelText("S: 1 of 3 completed")).toBeTruthy();

    // It sits alongside the always-visible stat tiles, not in place of them.
    expect(screen.getByText("Active days")).toBeTruthy();
  });

  test("stays visible (not duplicated or hidden) once the card is expanded", async () => {
    renderWithProviders(
      <WeeklyReviewCard
        days={days}
        expanded
        isSmallScreen={false}
        onToggle={jest.fn()}
        review={review}
      />
    );

    // Expanding reveals WeeklyReviewDetails's own per-habit breakdown; the
    // dot row should still appear exactly once, not re-rendered inside the
    // expanded details section too.
    expect(await screen.findAllByLabelText("M: 2 of 3 completed")).toHaveLength(1);
  });

  test("renders one dot per day even when the week has no scheduled habits yet", async () => {
    const emptyWeek = days.map((day) => ({ ...day, completedCount: 0, totalHabits: 0 }));

    renderWithProviders(
      <WeeklyReviewCard
        days={emptyWeek}
        expanded={false}
        isSmallScreen={false}
        onToggle={jest.fn()}
        review={review}
      />
    );

    expect(await screen.findAllByLabelText(/: 0 of 0 completed/)).toHaveLength(7);
  });
});

// Covers the week-definition swap's copy changes (Thread C follow-up -
// utils/weeklyReview.js / components/stats/WeeklyReviewCard.js): wording
// that assumed a resettable calendar-week boundary either dropped ("Week
// in progress") or reworded to be window-agnostic ("Open so far" -> "Open",
// per-habit breakdown status strings). `review` here already carries the
// wording getWeeklyReview would produce for the rolling window (see
// utils/weeklyReview.js's getRollingComparisonLabel/getWeeklyHabitStatus) -
// this suite is about what the card does with that data, not re-deriving
// it; utils/weeklyReview.js's own coverage in scripts/logic-smoke-test.cjs
// verifies the data layer.
describe("WeeklyReviewCard week-definition copy", () => {
  test("collapsed tile reads 'Open', not 'Open so far'", async () => {
    renderWithProviders(
      <WeeklyReviewCard
        days={days}
        expanded={false}
        isSmallScreen={false}
        onToggle={jest.fn()}
        review={review}
      />
    );

    expect(await screen.findByText("Open")).toBeTruthy();
    expect(screen.queryByText("Open so far")).toBeNull();
  });

  test("expanded view has no 'Week status' row and never renders 'Week in progress'", async () => {
    renderWithProviders(
      <WeeklyReviewCard
        days={days}
        expanded
        isSmallScreen={false}
        onToggle={jest.fn()}
        review={review}
      />
    );

    expect(await screen.findByText("Date range")).toBeTruthy();
    expect(screen.queryByText("Week status")).toBeNull();
    expect(screen.queryByText("Week in progress")).toBeNull();
    expect(screen.queryByLabelText(/Week in progress/)).toBeNull();
  });

  // habit.status's visible text was dropped from this row (Phase 13
  // text-density pass - rate% + count already say the same thing), so
  // this now checks the accessibilityLabel instead of visible text. Keeps
  // this test's original purpose: guarding that the window-agnostic
  // wording ("last 7 days", not "this week") is what actually reaches
  // the user, screen-reader or not.
  test("per-habit breakdown row's accessibility label uses window-agnostic status text", async () => {
    renderWithProviders(
      <WeeklyReviewCard
        days={days}
        expanded
        isSmallScreen={false}
        onToggle={jest.fn()}
        review={review}
      />
    );

    expect(
      await screen.findByLabelText(/Complete \(last 7 days\)/)
    ).toBeTruthy();
    expect(screen.queryByLabelText(/Complete this week/)).toBeNull();
    expect(screen.queryByText("Complete (last 7 days)")).toBeNull();
  });

  test("composite header accessibility label omits weekStatus cleanly (no stray 'undefined')", async () => {
    renderWithProviders(
      <WeeklyReviewCard
        days={days}
        expanded={false}
        isSmallScreen={false}
        onToggle={jest.fn()}
        review={review}
      />
    );

    const header = await screen.findByLabelText(/^Weekly review\./);

    expect(header.props.accessibilityLabel).not.toMatch(/undefined/);
    expect(header.props.accessibilityLabel).toBe(
      "Weekly review. 3 Aug - 9 Aug. 10 of 14 scheduled opportunities completed. 71%. 3 active days. +5% vs last week"
    );
  });
});
