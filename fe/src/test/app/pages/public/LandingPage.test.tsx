import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LandingPage } from "../../../../app/pages/public/LandingPage";
import { env } from "../../../../app/lib/env";
import { api } from "../../../../app/lib/urls";

const renderPage = () =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );

describe("LandingPage", () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("renders public listings from the API", async () => {
    const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url.includes(api.publicApartments)) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "OK",
            data: {
              apartments: {
                data: [
                  {
                    id: 1,
                    unit_code: "A1",
                    yearly_price: 1200000,
                    status: "vacant",
                    building: { name: "Sunrise Apartments", city: "Lagos", state: "Lagos" },
                  },
                ],
              },
            },
            errors: null,
          }),
          { status: 200 }
        );
      }

      if (url.includes(api.publicBuildingsForSale)) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "OK",
            data: {
              buildings: {
                data: [
                  {
                    id: 2,
                    name: "Riverside Complex",
                    sale_price: 850000000,
                    city: "Portland",
                    state: "OR",
                  },
                ],
              },
            },
            errors: null,
          }),
          { status: 200 }
        );
      }

      return new Response(JSON.stringify({ success: true, data: [] }), { status: 200 });
    });

    vi.stubGlobal("fetch", mockFetch);

    renderPage();

    expect(await screen.findByText("Available Apartments")).toBeInTheDocument();
    expect(await screen.findByText("Sunrise Apartments - A1")).toBeInTheDocument();
    expect(await screen.findByText("Buildings For Sale")).toBeInTheDocument();
    expect(await screen.findByText("Riverside Complex")).toBeInTheDocument();
  });

  it("shows empty states when no listings are available", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          success: true,
          message: "OK",
          data: [],
          errors: null,
        }),
        { status: 200 }
      )
    );

    vi.stubGlobal("fetch", mockFetch);

    renderPage();

    expect(await screen.findByText("No public listings yet")).toBeInTheDocument();
    expect(await screen.findByText("No listings for sale")).toBeInTheDocument();
  });

  it("replaces login actions with a dashboard link for authenticated users", async () => {
    window.localStorage.setItem(env.authTokenKey, "tenant-token");

    const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url.includes(api.authMe)) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "OK",
            data: {
              user: {
                id: 7,
                name: "Ada Tenant",
                role: "tenant",
              },
            },
            errors: null,
          }),
          { status: 200 }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "OK",
          data: [],
          errors: null,
        }),
        { status: 200 }
      );
    });

    vi.stubGlobal("fetch", mockFetch);

    renderPage();

    expect(await screen.findByRole("link", { name: /go to dashboard/i })).toHaveAttribute("href", "/tenant");
    expect(screen.queryAllByRole("link", { name: /^login$/i })).toHaveLength(0);
    expect(screen.queryAllByRole("link", { name: /get started/i })).toHaveLength(0);
  });
});
