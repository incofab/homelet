import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RegisterPage } from "../../../../app/pages/public/RegisterPage";
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

describe("RegisterPage", () => {
  it("registers a user and routes to the management dashboard by default", async () => {
    mockFetch([
      {
        match: (url, init) => url.includes(api.authRegister) && init?.method === "POST",
        response: () =>
          apiSuccess({
            user: { id: 2, name: "Platform User", email: "user@example.com", role: "user" },
            dashboard: "admin",
            token: "user-token",
          }),
      },
    ]);

    renderWithRoute(<RegisterPage />);

    await userEvent.type(screen.getByPlaceholderText("Jane Doe"), "Platform User");
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("Create a password"), "secret");
    await userEvent.type(screen.getByPlaceholderText("Confirm your password"), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(window.localStorage.getItem("tenanta_token")).toBe("user-token");
    expect(mockNavigate).toHaveBeenCalledWith(routes.adminRoot);
  });
});
