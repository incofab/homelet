import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CreateBuilding } from "../../../../app/pages/admin/CreateBuilding";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";
import { api, routes } from "../../../../app/lib/urls";

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("CreateBuilding", () => {
  it("submits the form and navigates to the new building", async () => {
    mockFetch([
      {
        match: (url, init) => url.includes(api.buildings) && init?.method === "POST",
        response: () => apiSuccess({ id: 123, name: "Skyline Tower" }),
      },
    ]);

    renderWithRoute(<CreateBuilding />);

    await userEvent.type(screen.getByPlaceholderText("e.g., Skyline Tower"), "Skyline Tower");
    await userEvent.type(screen.getByPlaceholderText("123 Main Street"), "123 Main Street");
    const lagosFields = screen.getAllByPlaceholderText("Lagos");
    await userEvent.type(lagosFields[0], "Lagos");
    await userEvent.type(lagosFields[1], "Lagos");

    await userEvent.click(screen.getByRole("button", { name: "Create Building" }));

    expect(mockNavigate).toHaveBeenCalledWith(routes.adminBuilding(123));
  });
});
