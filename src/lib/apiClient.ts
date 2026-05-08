import { API_BASE_DISPLAY, API_HEALTH_URL, apiUrl } from "../config/apiBase";

const AUTH_TOKEN_KEY = "taxsync.token";
const DEFAULT_TIMEOUT_MS = 10000;
const HEALTH_TIMEOUT_MS = 3000;
const HEALTH_CACHE_MS = 5000;

type RetryOptions = {
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
};

type ApiFetchOptions = RequestInit & RetryOptions & {
  skipHealthCheck?: boolean;
};

type ApiErrorPayload = {
  message?: string;
  debug?: {
    reason?: string;
  };
};

let lastHealthyAt = 0;

export class ApiConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiConnectionError";
  }
}

const sleep = (delayMs: number) => new Promise<void>((resolve) => window.setTimeout(resolve, delayMs));

const isFormDataBody = (body: BodyInit | null | undefined): body is FormData => {
  return typeof FormData !== "undefined" && body instanceof FormData;
};

const isNetworkFailure = (error: unknown) => {
  return error instanceof TypeError || (error instanceof DOMException && error.name === "AbortError");
};

const shouldRetryStatus = (status: number) => status === 408 || status === 425 || status === 429 || status >= 500;

const buildConnectionMessage = () => {
  return `Cannot reach the TaxSync API (${API_BASE_DISPLAY}). Start the backend and wait for /api/health to return healthy, then try again.`;
};

const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const buildHeaders = (headers: HeadersInit | undefined, body: BodyInit | null | undefined) => {
  const mergedHeaders = new Headers(headers);
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (body && !isFormDataBody(body) && !mergedHeaders.has("Content-Type")) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  if (token && !mergedHeaders.has("Authorization")) {
    mergedHeaders.set("Authorization", `Bearer ${token}`);
  }

  return mergedHeaders;
};

const parseJson = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
};

const getApiErrorMessage = (response: Response, data: unknown) => {
  const payload = data as ApiErrorPayload | null;

  if (payload?.debug?.reason) return payload.debug.reason;
  if (payload?.message) return payload.message;
  if (response.status === 401) return "Your session has expired. Please sign in again.";
  if (response.status === 403) return "You do not have permission to perform this action.";

  return `Request failed with HTTP ${response.status}.`;
};

export const waitForApiHealth = async (options: RetryOptions = {}) => {
  if (Date.now() - lastHealthyAt < HEALTH_CACHE_MS) return;

  const retries = options.retries ?? 8;
  const retryDelayMs = options.retryDelayMs ?? 600;
  const timeoutMs = options.timeoutMs ?? HEALTH_TIMEOUT_MS;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        API_HEALTH_URL,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        },
        timeoutMs,
      );

      if (response.ok) {
        lastHealthyAt = Date.now();
        return;
      }
    } catch {
      lastHealthyAt = 0;
    }

    if (attempt < retries) {
      await sleep(retryDelayMs * Math.min(attempt + 1, 4));
    }
  }

  throw new ApiConnectionError(buildConnectionMessage());
};

export const apiFetch = async (path: string, options: ApiFetchOptions = {}) => {
  const {
    retries = 2,
    retryDelayMs = 700,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    skipHealthCheck = false,
    ...requestInit
  } = options;

  if (!skipHealthCheck) {
    await waitForApiHealth({ retries: 6, retryDelayMs: 700, timeoutMs: HEALTH_TIMEOUT_MS });
  }

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        apiUrl(path),
        {
          ...requestInit,
          headers: buildHeaders(requestInit.headers, requestInit.body),
          cache: requestInit.cache ?? "no-store",
        },
        timeoutMs,
      );

      if (!shouldRetryStatus(response.status) || attempt === retries) {
        return response;
      }

      lastHealthyAt = 0;
    } catch (error) {
      lastHealthyAt = 0;

      if (!isNetworkFailure(error) || attempt === retries) {
        throw new ApiConnectionError(buildConnectionMessage());
      }
    }

    await waitForApiHealth({ retries: 3, retryDelayMs, timeoutMs: HEALTH_TIMEOUT_MS }).catch(() => undefined);
    await sleep(retryDelayMs * Math.min(attempt + 1, 4));
  }

  throw new ApiConnectionError(buildConnectionMessage());
};

export const apiJson = async <T,>(path: string, options: ApiFetchOptions = {}) => {
  const response = await apiFetch(path, options);
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(response, data));
  }

  return data as T;
};