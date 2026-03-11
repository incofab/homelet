import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi } from "vitest";

export type FetchHandler = {
  match: (url: string, init?: RequestInit) => boolean;
  response: () => Response | Promise<Response>;
};

export const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });

export const apiSuccess = (data: unknown, status = 200) =>
  jsonResponse({ success: true, message: "OK", data, errors: null }, status);

export const mockFetch = (handlers: FetchHandler[], fallback?: Response) => {
  const mock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input.toString();
    const handler = handlers.find((item) => item.match(url, init));
    if (handler) {
      return handler.response();
    }
    return fallback ?? apiSuccess({});
  });

  vi.stubGlobal("fetch", mock);
  return mock;
};

export const renderWithRoute = (
  ui: ReactElement,
  {
    route = "/",
    path = "/",
  }: {
    route?: string;
    path?: string;
  } = {}
) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={ui} />
      </Routes>
    </MemoryRouter>
  );
