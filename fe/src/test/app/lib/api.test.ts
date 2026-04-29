import { afterEach, describe, expect, it, vi } from "vitest";
import { apiPost, setAuthToken } from "../../../app/lib/api";

describe("apiRequest", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.unstubAllGlobals();
    setAuthToken(null);
  });

  it("sends Accept and Authorization headers for JSON API requests", async () => {
    setAuthToken("admin-token");

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ success: true, message: "OK", data: {}, errors: null }), {
        status: 201,
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await apiPost("/expenses", {
      building_id: 2,
      title: "Generator service",
      amount: 120000,
      expense_date: "2026-04-10",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);

    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Authorization")).toBe("Bearer admin-token");
  });

  it("preserves multipart uploads while still asking for JSON responses", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ success: true, message: "OK", data: {}, errors: null }), {
        status: 201,
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await apiPost("/maintenance-requests/4/media", new FormData());

    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);

    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.has("Content-Type")).toBe(false);
  });
});
