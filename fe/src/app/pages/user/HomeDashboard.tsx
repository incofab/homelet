import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, Home, Search, Settings, UserCircle } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getAuthToken } from "../../lib/api";
import { useAuthSession } from "../../hooks/useAuthSession";
import { api, routes } from "../../lib/urls";
import type { DashboardContext } from "../../lib/responses";

type MeResponse = {
  user?: { id?: number; name?: string };
  dashboard?: "admin" | "tenant" | "home";
  dashboard_context?: DashboardContext;
};

const accountActions = [
  {
    title: "Profile",
    description: "View your account information and profile media.",
  },
  {
    title: "Update Profile",
    description: "Keep your contact details and preferences current.",
  },
  {
    title: "Change Password",
    description: "Protect your account with a fresh password.",
  },
];

const ctaActions = [
  {
    title: "Register a Building",
    description: "Start managing a new property on Homelet.",
    href: routes.registerBuilding,
    icon: Building2,
  },
  {
    title: "Find an Apartment",
    description: "Browse public listings and compare available units.",
    href: routes.root,
    icon: Search,
  },
  {
    title: "Buy a House",
    description: "Explore buildings and homes available for sale.",
    href: routes.root,
    icon: Home,
  },
];

export function HomeDashboard() {
  const navigate = useNavigate();
  const authToken = useMemo(() => getAuthToken(), []);
  const { logout, loggingOut } = useAuthSession();
  const meQuery = useApiQuery<MeResponse>(api.authMe, {
    enabled: Boolean(authToken),
  });

  useEffect(() => {
    if (!authToken) {
      navigate(routes.login);
    }
  }, [authToken, navigate]);

  const userName = meQuery.data?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Welcome</p>
            <h1 className="mt-2 text-3xl">Hello, {userName}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Your account is ready. Start by exploring listings, registering a building, or
              managing the basics of your profile.
            </p>
          </div>
          <Button variant="ghost" onClick={logout}>
            {loggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <div className="mb-5 flex items-center gap-3">
              <UserCircle className="text-primary" size={24} />
              <div>
                <h2 className="text-xl">Account Shortcuts</h2>
                <p className="text-sm text-muted-foreground">
                  Basic controls for a new account.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {accountActions.map((action) => (
                <div
                  key={action.title}
                  className="flex items-start justify-between gap-4 rounded-xl border border-border bg-background px-4 py-4"
                >
                  <div>
                    <p>{action.title}</p>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                    Coming soon
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-primary text-primary-foreground">
            <div className="mb-5 flex items-center gap-3">
              <Settings size={24} />
              <div>
                <h2 className="text-xl">What You Can Do Next</h2>
                <p className="text-sm text-primary-foreground/80">
                  Quick paths into the rest of the platform.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {ctaActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.title}
                    to={action.href}
                    className="flex items-start gap-4 rounded-xl bg-primary-foreground/10 px-4 py-4 transition-colors hover:bg-primary-foreground/15"
                  >
                    <div className="rounded-lg bg-primary-foreground/15 p-3">
                      <Icon size={20} />
                    </div>
                    <div>
                      <p>{action.title}</p>
                      <p className="text-sm text-primary-foreground/80">{action.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
