export const motivationalQuotes = [
  "Small steps still count.",
  "Show up once today.",
  "Progress likes consistency.",
  "Make it easy to begin.",
  "One check-in can restart momentum.",
  "Repeat the basics.",
  "Today is enough to build from.",
];

export function getQuoteOfTheDay() {
  const startOfYear = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((new Date() - startOfYear) / 86400000);

  return motivationalQuotes[dayOfYear % motivationalQuotes.length];
}
