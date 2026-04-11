import { describe, expect, it, vi } from "vitest";
import { RegisterBuildingPublic } from "../../../../app/pages/public/RegisterBuildingPublic";
import { routes, withRedirect } from "../../../../app/lib/urls";
import { renderWithRoute } from "../../../testUtils";

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("RegisterBuildingPublic", () => {
  it("redirects guests to signup with a return path", () => {
    window.localStorage.removeItem("tenanta_token");

    renderWithRoute(<RegisterBuildingPublic />, {
      route: routes.registerBuilding,
      path: routes.registerBuilding,
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      withRedirect(routes.register, routes.registerBuilding),
      { replace: true }
    );
  });
});
