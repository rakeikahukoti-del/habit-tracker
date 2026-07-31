import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  defaultAppPreferences,
  getAppPreferences,
  setAppPreference,
} from "../storage/appPreferences";

export function useAppPreferenceSettings() {
  const [preferences, setPreferences] = useState(defaultAppPreferences);
  const [message, setMessage] = useState("");
  const [updating, setUpdating] = useState(false);
  const preferenceUpdatingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadPreferences() {
        try {
          const savedPreferences = await getAppPreferences();

          if (isActive) {
            setPreferences(savedPreferences);
          }
        } catch {
          if (isActive) {
            setMessage("Could not load preferences. Please try again.");
          }
        }
      }

      loadPreferences();

      return () => {
        isActive = false;
      };
    }, [])
  );

  async function setPreferenceValue(key, value) {
    if (preferenceUpdatingRef.current) {
      return;
    }

    preferenceUpdatingRef.current = true;
    setUpdating(true);

    try {
      setMessage("");
      setPreferences((current) => ({ ...current, [key]: value }));
      setPreferences(await setAppPreference(key, value));
    } catch {
      setMessage("Could not save that preference. Please try again.");
      try {
        setPreferences(await getAppPreferences());
      } catch {
        setPreferences(defaultAppPreferences);
      }
    } finally {
      preferenceUpdatingRef.current = false;
      setUpdating(false);
    }
  }

  return {
    message,
    preferences,
    setPreferenceValue,
    updating,
  };
}
