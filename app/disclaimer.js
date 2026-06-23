import LegalScreen from "../components/LegalScreen";

export default function DisclaimerScreen() {
  return (
    <LegalScreen
      title="Disclaimer"
      body={[
        "Momentum is for personal habit tracking only.",
        "The app does not provide medical, mental health, legal, financial, or professional advice.",
        "Do not rely on Momentum as a substitute for advice from a qualified professional.",
        "Reminder delivery can vary based on device settings, notification permissions, operating system behavior, and battery settings.",
        "Because data is stored locally, uninstalling the app or clearing app data may remove your habits and history.",
        "You are responsible for your own use of the app and any decisions you make based on your habit data.",
      ]}
    />
  );
}
