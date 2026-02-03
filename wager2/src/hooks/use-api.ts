"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseApiState {
  loading: boolean;
  error: string | null;
}

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

interface UseApiResult extends UseApiState {
  get: <T = unknown>(endpoint: string) => Promise<ApiResult<T>>;
  post: <T = unknown>(endpoint: string, data?: unknown) => Promise<ApiResult<T>>;
  put: <T = unknown>(endpoint: string, data?: unknown) => Promise<ApiResult<T>>;
  patch: <T = unknown>(endpoint: string, data?: unknown) => Promise<ApiResult<T>>;
  del: <T = unknown>(endpoint: string) => Promise<ApiResult<T>>;
  reset: () => void;
  abort: () => void;
}

export function useApi(): UseApiResult {
  const [state, setState] = useState<UseApiState>({
    loading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null });
  }, []);

  const request = useCallback(
    async <T>(
      endpoint: string,
      method: string,
      data?: unknown
    ): Promise<ApiResult<T>> => {
      // Abort any in-flight request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setState({ loading: true, error: null });

      try {
        const options: RequestInit = {
          method,
          headers: { "Content-Type": "application/json" },
          signal: abortControllerRef.current.signal,
        };

        if (data !== undefined) {
          options.body = JSON.stringify(data);
        }

        const response = await fetch(endpoint, options);

        // No content responses
        if (response.status === 204 || response.status === 201) {
          setState({ loading: false, error: null });
          return { ok: true, data: null as T };
        }

        // Try to parse JSON
        const text = await response.text();
        const json = text ? JSON.parse(text) : null;

        if (!response.ok) {
          const errorMessage = json?.error || `Request failed (${response.status})`;
          setState({ loading: false, error: errorMessage });
          return { ok: false, error: errorMessage };
        }

        setState({ loading: false, error: null });
        return { ok: true, data: json as T };
      } catch (err) {
        // Don't update state if aborted
        if (err instanceof Error && err.name === "AbortError") {
          return { ok: false, error: "Request aborted" };
        }

        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setState({ loading: false, error: errorMessage });
        return { ok: false, error: errorMessage };
      }
    },
    []
  );

  const get = useCallback(
    <T = unknown>(endpoint: string) => request<T>(endpoint, "GET"),
    [request]
  );

  const post = useCallback(
    <T = unknown>(endpoint: string, data?: unknown) => request<T>(endpoint, "POST", data),
    [request]
  );

  const put = useCallback(
    <T = unknown>(endpoint: string, data?: unknown) => request<T>(endpoint, "PUT", data),
    [request]
  );

  const patch = useCallback(
    <T = unknown>(endpoint: string, data?: unknown) => request<T>(endpoint, "PATCH", data),
    [request]
  );

  const del = useCallback(
    <T = unknown>(endpoint: string) => request<T>(endpoint, "DELETE"),
    [request]
  );

  return {
    ...state,
    get,
    post,
    put,
    patch,
    del,
    reset,
    abort,
  };
}
