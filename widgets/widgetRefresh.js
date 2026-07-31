import AsyncStorage from "@react-native-async-storage/async-storage";

export const WIDGET_REFRESH_KEY = "momentum:widget-refresh";

export async function requestWidgetRefresh(reason = "manual", metadata = {}) {
  const refreshRequest = {
    metadata: sanitizeMetadata(metadata),
    reason: typeof reason === "string" && reason.trim() ? reason.trim() : "manual",
    requestedAt: new Date().toISOString(),
    version: 1,
  };

  try {
    await AsyncStorage.setItem(WIDGET_REFRESH_KEY, JSON.stringify(refreshRequest));

    return {
      ok: true,
      refreshRequest,
    };
  } catch {
    return {
      error: "Widget refresh could not be recorded.",
      ok: false,
      refreshRequest,
    };
  }
}

export async function getLastWidgetRefreshRequest() {
  try {
    const rawRequest = await AsyncStorage.getItem(WIDGET_REFRESH_KEY);

    if (!rawRequest) {
      return null;
    }

    const parsedRequest = JSON.parse(rawRequest);

    if (!parsedRequest || typeof parsedRequest !== "object") {
      return null;
    }

    return {
      metadata: sanitizeMetadata(parsedRequest.metadata),
      reason:
        typeof parsedRequest.reason === "string" && parsedRequest.reason.trim()
          ? parsedRequest.reason.trim()
          : "manual",
      requestedAt:
        typeof parsedRequest.requestedAt === "string"
          ? parsedRequest.requestedAt
          : "",
      version: 1,
    };
  } catch {
    return null;
  }
}

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata).filter(
      ([key, value]) =>
        typeof key === "string" &&
        ["string", "number", "boolean"].includes(typeof value)
    )
  );
}
