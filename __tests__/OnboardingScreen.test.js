import { renderWithProviders, screen } from "../test/test-utils";
import OnboardingScreen from "../app/onboarding";

// Thread D (onboarding/tutorial): added the one piece of form-related
// content the survey found genuinely worth teaching - that category
// selection isn't just organizational, it shows up in Analytics too.
// Note the wording deliberately doesn't claim category feeds a "strongest
// category" analytics aggregation (getBestCategory) - that function is
// dead code with zero callers anywhere in the app (confirmed by grep, same
// as the unrelated dead function found in Thread C Commit 1), so category's
// only genuinely live analytics use is being displayed per-habit in
// HabitPerformanceList. Copy corrected to match what's actually shipped;
// see the commit message for the full discrepancy.
describe("OnboardingScreen", () => {
  test("includes the category/Analytics content point", async () => {
    renderWithProviders(<OnboardingScreen />);

    expect(
      await screen.findByText(
        "Category isn't just organization — it shows up in Analytics too."
      )
    ).toBeTruthy();
  });

  test("still renders the three existing brand-pitch points unchanged", async () => {
    renderWithProviders(<OnboardingScreen />);

    await screen.findByText(
      "Category isn't just organization — it shows up in Analytics too."
    );

    expect(screen.getByText("Home keeps today focused.")).toBeTruthy();
    expect(
      screen.getByText("Progress shows streaks, trends, and weekly context.")
    ).toBeTruthy();
    expect(
      screen.getByText("XP and ranks reward consistency without pressure.")
    ).toBeTruthy();
  });
});
