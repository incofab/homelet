import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TenantsList } from "../../../../app/pages/admin/TenantsList";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";
import { api } from "../../../../app/lib/urls";

describe("TenantsList", () => {
  it("renders tenants from the API", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.tenants),
        response: () =>
          apiSuccess({
            tenants: [
              {
                id: 1,
                name: "Jane Doe",
                email: "jane@example.com",
                active_lease: { id: 99, status: "active" },
              },
            ],
          }),
      },
    ]);

    renderWithRoute(<TenantsList />);

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });
});
