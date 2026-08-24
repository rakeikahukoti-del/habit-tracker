import HabitStatCard from "./HabitStatCard";

// Built on the shared HabitStatCard template (Phase 13 Initiative 2) -
// uses the "visual" slot (progress bar + milestone chips) rather than the
// label/value rows the merged HabitWeekCard uses. See HabitWeekCard.js for
// the sibling half of this merge.
export default function MilestoneCard({ isSmallScreen, milestones }) {
  const nextLabel = milestones.nextMilestone
    ? `${milestones.completionCount}/${milestones.nextMilestone}`
    : `${milestones.completionCount}`;
  const accessibilityLabel = `Habit milestones. ${milestones.completionCount} completions. ${
    milestones.nextMilestone
      ? `${milestones.nextMilestone - milestones.completionCount} more to reach ${milestones.nextMilestone}.`
      : "All tracked milestones reached."
  }`;

  return (
    <HabitStatCard
      accessibilityLabel={accessibilityLabel}
      isSmallScreen={isSmallScreen}
      label="Total completions"
      pill={milestones.nextMilestone ? "Next" : "Complete"}
      value={nextLabel}
      visual={{
        chips: milestones.milestones.map((milestone) => ({
          completed: milestone.completed,
          key: milestone.target,
          label: `${milestone.target}`,
        })),
        percentage: milestones.progressToNext,
      }}
    />
  );
}
