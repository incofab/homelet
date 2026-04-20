import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { ImpersonationBanner } from "../../../app/components/ImpersonationBanner";
import { setImpersonationState } from "../../../app/lib/impersonation";
import { apiSuccess, mockFetch } from "../../testUtils";
import { api } from "../../../app/lib/urls";

describe("ImpersonationBanner", () => {
  it("restores the original account when stop impersonate is clicked", async () => {
    window.localStorage.setItem("tenanta_token", "impersonated-token");
    window.localStorage.setItem(
      "tenanta_impersonation",
      JSON.stringify({
        originalToken: "admin-token",
        impersonatorId: 1,
        impersonatorName: "Admin",
        impersonatedUserId: 9,
        impersonatedUserName: "Tenant User",
      })
    );

    mockFetch([
      {
        match: (url, init) => url.includes(api.authLogout) && init?.method === "POST",
        response: () => apiSuccess(null),
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/tenant"]}>
        <Routes>
          <Route
            path="/tenant"
            element={
              <>
                <ImpersonationBanner />
                <div>Tenant page</div>
              </>
            }
          />
          <Route path="/admin/users" element={<div>Users list</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("You are impersonating Tenant User")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Stop Impersonate" }));

    expect(window.localStorage.getItem("tenanta_token")).toBe("admin-token");
    expect(window.localStorage.getItem("tenanta_impersonation")).toBeNull();
    expect(await screen.findByText("Users list")).toBeInTheDocument();
  });

  it("appears when impersonation starts in the current tab", async () => {
    window.localStorage.clear();

    render(
      <MemoryRouter>
        <ImpersonationBanner />
      </MemoryRouter>
    );

    expect(screen.queryByText(/You are impersonating/i)).not.toBeInTheDocument();

    setImpersonationState({
      originalToken: "admin-token",
      impersonatorId: 1,
      impersonatorName: "Admin",
      impersonatedUserId: 4,
      impersonatedUserName: "Landlord",
    });

    expect(await screen.findByText("You are impersonating Landlord")).toBeInTheDocument();
  });
});
