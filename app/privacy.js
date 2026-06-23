import LegalScreen from "../components/LegalScreen";

export default function PrivacyPolicyScreen() {
  return (
    <LegalScreen
      title="Privacy Policy"
      body={[
        "Momentum is for personal habit tracking only.",
        "Your habit data is stored locally on your device. The app uses local storage and does not require an account or backend.",
        "Momentum does not sell, rent, or share your personal data.",
        "Local notifications are scheduled on your device only when you choose a reminder time for a habit.",
        "Deleting habits or resetting the app removes local habit data from the app and cancels scheduled habit reminders.",
        "You are responsible for how you use the app and for managing your own device data.",
      ]}
    />
  );
}
