import { toDateKey } from "./habitStats";

export function getCalendarMonthDays(habit, visibleMonth, now = new Date()) {
  const completedSet = new Set(habit?.completedDates || []);
  const todayKey = toDateKey(now);
  const today = startOfDay(now);
  const monthStart = startOfMonth(visibleMonth);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingBlanks = firstDay.getDay();
  const blanks = Array.from({ length: leadingBlanks }, () => ({
    isBlank: true,
  }));
  const days = Array.from({ length: lastDay.getDate() }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const dateKey = toDateKey(date);

    return {
      completed: completedSet.has(dateKey),
      dateKey,
      dayOfMonth: date.getDate(),
      isFuture: startOfDay(date) > today,
      isToday: dateKey === todayKey,
    };
  });

  return [...blanks, ...days];
}

export function isCurrentOrFutureMonth(visibleMonth, now = new Date()) {
  return startOfMonth(visibleMonth) >= startOfMonth(now);
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
