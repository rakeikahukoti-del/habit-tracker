export const appearanceOptions = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

const lightFallbackThemeKeys = new Set(["bronze"]);
const darkFallbackThemeKeys = new Set([
  "dark",
  "diamond",
  "gold",
  "master",
  "platinum",
  "silver",
]);

export function normalizeThemePreference(preference, systemScheme = "dark") {
  if (preference == null || preference === "") {
    return "light";
  }

  if (preference === "light") {
    return "light";
  }

  if (preference === "system") {
    return systemScheme === "light" ? "light" : "dark";
  }

  if (lightFallbackThemeKeys.has(preference)) {
    return "light";
  }

  if (darkFallbackThemeKeys.has(preference)) {
    return "dark";
  }

  return "dark";
}

export function isSupportedThemePreference(preference) {
  return (
    preference === "light" || preference === "dark" || preference === "system"
  );
}
