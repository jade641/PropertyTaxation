const runtimeMode = (import.meta.env.VITE_RUNTIME_MODE ?? "local").trim().toLowerCase();
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

if (!rawBaseUrl) {
  throw new Error("VITE_API_BASE_URL is required. Use /api for local Vite proxy and Docker nginx proxy modes.");
}

const isAbsoluteHttpUrl = (value: string) => /^https?:\/\//i.test(value);

const isLoopbackApiUrl = (value: string) => {
  if (!isAbsoluteHttpUrl(value)) return false;

  const parsed = new URL(value);
  return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname.toLowerCase());
};

if (runtimeMode === "docker" && isLoopbackApiUrl(rawBaseUrl)) {
  throw new Error("Docker frontend mode must use the same-origin /api proxy instead of a localhost API URL.");
}

const normalizeApiBaseUrl = (value: string) => {
  const trimmed = value.replace(/\/+$/, "");
  const lowerTrimmed = trimmed.toLowerCase();

  if (lowerTrimmed === "/api") return "";

  return lowerTrimmed.endsWith("/api")
    ? trimmed.slice(0, -4).replace(/\/+$/, "")
    : trimmed;
};

export const API_BASE_URL = normalizeApiBaseUrl(rawBaseUrl);
export const API_ROOT_URL = API_BASE_URL ? `${API_BASE_URL}/api` : "/api";
export const API_BASE_DISPLAY = API_BASE_URL || "same-origin /api";

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_ROOT_URL}${normalizedPath === "/" ? "" : normalizedPath}`;
};

export const API_HEALTH_URL = apiUrl("/health");
