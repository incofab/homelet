import { apiRoot, env } from "./env";

type ApiErrorPayload = Record<string, string[]> | null;
type ApiActivityListener = (pendingRequests: number) => void;

export const AUTH_TOKEN_CHANGED_EVENT = "homelet:auth-token-changed";

const apiActivityListeners = new Set<ApiActivityListener>();
let pendingApiRequests = 0;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: ApiErrorPayload;
}

export class ApiError extends Error {
  status: number;
  errors: ApiErrorPayload;

  constructor(message: string, status: number, errors: ApiErrorPayload = null) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

const notifyApiActivityListeners = () => {
  apiActivityListeners.forEach((listener) => listener(pendingApiRequests));
};

const beginApiRequest = () => {
  pendingApiRequests += 1;
  notifyApiActivityListeners();
};

const endApiRequest = () => {
  pendingApiRequests = Math.max(0, pendingApiRequests - 1);
  notifyApiActivityListeners();
};

export const subscribeToApiActivity = (listener: ApiActivityListener) => {
  apiActivityListeners.add(listener);
  listener(pendingApiRequests);

  return () => {
    apiActivityListeners.delete(listener);
  };
};

export const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(env.authTokenKey);
};

export const setAuthToken = (token: string | null) => {
  if (typeof window === "undefined") return;

  if (!token) {
    window.localStorage.removeItem(env.authTokenKey);
  } else {
    window.localStorage.setItem(env.authTokenKey, token);
  }

  window.dispatchEvent(new CustomEvent(AUTH_TOKEN_CHANGED_EVENT));
};

const buildUrl = (path: string) => {
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${apiRoot}${normalized}`;
};

const parseJson = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
};

export const apiRequest = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  beginApiRequest();

  try {
    const response = await fetch(buildUrl(path), {
      ...options,
      headers,
    });

    const json = await parseJson(response);

    if (!response.ok) {
      const message = json?.message || `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, json?.errors ?? null);
    }

    if (json && typeof json === "object" && "success" in json) {
      if (!json.success) {
        throw new ApiError(json.message || "Request failed", response.status, json.errors ?? null);
      }
      return json.data as T;
    }

    return json as T;
  } finally {
    endApiRequest();
  }
};

export const apiGet = async <T>(path: string, options: RequestInit = {}) => {
  return apiRequest<T>(path, { ...options, method: "GET" });
};

export const apiPost = async <T, B = unknown>(
  path: string,
  body?: B,
  options: RequestInit = {}
) => {
  const payload = body instanceof FormData ? body : body ? JSON.stringify(body) : undefined;
  return apiRequest<T>(path, { ...options, method: "POST", body: payload });
};

export const apiPut = async <T, B = unknown>(
  path: string,
  body?: B,
  options: RequestInit = {}
) => {
  const payload = body instanceof FormData ? body : body ? JSON.stringify(body) : undefined;
  return apiRequest<T>(path, { ...options, method: "PUT", body: payload });
};

export const apiDelete = async <T>(path: string, options: RequestInit = {}) => {
  return apiRequest<T>(path, { ...options, method: "DELETE" });
};
