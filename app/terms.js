import LegalScreen from "../components/LegalScreen";

export default function TermsOfUseScreen() {
  return (
    <LegalScreen
      title="Terms of Use"
      body={[
        "Momentum is a simple app for personal habit tracking only.",
        "By using the app, you agree to use it responsibly and at your own discretion.",
        "You are responsible for the habits, reminders, and local data you create in the app.",
        "Momentum does not provide medical, mental health, legal, financial, or other professional advice.",
        "The app does not guarantee behavior change, health outcomes, productivity results, notification delivery, or data backup.",
        "Your habit data is stored locally on your device. Momentum does not sell or share personal data.",
      ]}
    />
  );
}
