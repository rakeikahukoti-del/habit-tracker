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
  breakdown: [],
  comparison: { available: true, label: "+5% vs last week" },
  completedCount: 10,
  completionRateLabel: "71%",
  context: "Keep completing habits to build this week's summary.",
  dateRange: "Mon 3 - Sun 9",
  focusHabit: null,
  missedCount: 4,
  possibleCount: 14,
  summaryLabel: "10 of 14",
  weekStatus: "Week in progress",
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
