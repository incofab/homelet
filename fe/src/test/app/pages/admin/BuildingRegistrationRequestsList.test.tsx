import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BuildingRegistrationRequestsList } from "../../../../app/pages/admin/BuildingRegistrationRequestsList";
import { apiSuccess, renderWithRoute } from "../../../testUtils";

describe("BuildingRegistrationRequestsList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders paginated registration requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        apiSuccess({
          requests: {
            data: [
              {
                id: 1,
                name: "Skyline Tower",
                status: "pending",
                city: "Lagos",
                state: "Lagos",
                country: "NG",
                owner_name: "Jane Doe",
                owner_email: "jane@example.com",
              },
            ],
            current_page: 1,
            last_page: 1,
            total: 1,
          },
        })
      )
    );

    renderWithRoute(<BuildingRegistrationRequestsList />);

    expect(await screen.findByText("Skyline Tower")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });
});
