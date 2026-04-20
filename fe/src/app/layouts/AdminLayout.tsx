import { Outlet, Link, Navigate, useLocation } from 'react-router';
import {
  Building2,
  LayoutDashboard,
  UserRound,
  FileText,
  MessageSquare,
  Menu,
  X,
  LogOut,
  ClipboardList,
  KeyRound,
  ReceiptText,
  Wrench,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { api, routeForDashboard, routes, withRedirect } from '../lib/urls';
import { useApiQuery } from '../hooks/useApiQuery';
import type { DashboardContext } from '../lib/responses';
import { useAuthSession } from '../hooks/useAuthSession';
import { useAuthToken } from '../hooks/useAuthToken';

type MeResponse = {
  user?: { role?: string };
  dashboard_context?: DashboardContext;
};

const formatRoleLabel = (role?: string) => {
  const normalized = role?.trim().toLowerCase() ?? 'user';

  switch (normalized) {
    case 'admin':
      return 'Platform Admin';
    case 'landlord':
      return 'Landlord';
    case 'manager':
      return 'Manager';
    case 'tenant':
      return 'Tenant';
    default:
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
};

const sidebarThemeForRole = (role?: string) => {
  switch (role?.trim().toLowerCase()) {
    case 'admin':
      return {
        shell: 'bg-slate-950 text-slate-50 border-slate-800',
        mobile: 'bg-slate-950 text-slate-50',
        muted: 'text-slate-300',
        hover: 'hover:bg-slate-800/80',
        active: 'bg-amber-400 text-slate-950',
        badge: 'bg-amber-400/15 text-amber-200 ring-1 ring-amber-300/20',
        brand: 'text-amber-300',
      };
    case 'landlord':
      return {
        shell: 'bg-emerald-950 text-emerald-50 border-emerald-900',
        mobile: 'bg-emerald-950 text-emerald-50',
        muted: 'text-emerald-200/75',
        hover: 'hover:bg-emerald-900/70',
        active: 'bg-emerald-300 text-emerald-950',
        badge: 'bg-emerald-300/15 text-emerald-100 ring-1 ring-emerald-200/20',
        brand: 'text-emerald-200',
      };
    case 'manager':
      return {
        shell: 'bg-sky-950 text-sky-50 border-sky-900',
        mobile: 'bg-sky-950 text-sky-50',
        muted: 'text-sky-200/75',
        hover: 'hover:bg-sky-900/70',
        active: 'bg-sky-300 text-sky-950',
        badge: 'bg-sky-300/15 text-sky-100 ring-1 ring-sky-200/20',
        brand: 'text-sky-200',
      };
    default:
      return {
        shell: 'bg-zinc-900 text-zinc-50 border-zinc-800',
        mobile: 'bg-zinc-900 text-zinc-50',
        muted: 'text-zinc-300',
        hover: 'hover:bg-zinc-800/80',
        active: 'bg-rose-300 text-rose-950',
        badge: 'bg-rose-300/15 text-rose-100 ring-1 ring-rose-200/20',
        brand: 'text-rose-200',
      };
  }
};

const hasAdminDashboardAccess = (
  role?: string,
  dashboardContext?: DashboardContext,
) => {
  if (dashboardContext?.available_dashboards.includes('admin')) {
    return true;
  }

  return ['admin', 'landlord', 'manager'].includes(
    role?.trim().toLowerCase() ?? '',
  );
};

export function AdminLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout, loggingOut } = useAuthSession();
  const authToken = useAuthToken();
  const selectProfile = useCallback((data: MeResponse) => data, []);
  const meQuery = useApiQuery<MeResponse, MeResponse>(api.authMe, {
    enabled: Boolean(authToken),
    select: selectProfile,
    deps: [authToken],
  });
  const currentRole = meQuery.data?.user?.role;
  const dashboardContext = meQuery.data?.dashboard_context;
  const roleLabel = formatRoleLabel(currentRole);
  const sidebarTheme = sidebarThemeForRole(currentRole);
  const isPlatformAdmin = currentRole === 'admin';
  const isLandlordOrManager = ['landlord', 'manager'].includes(
    currentRole?.trim().toLowerCase() ?? ''
  );
  const canSwitchToTenantDashboard = Boolean(meQuery.data?.dashboard_context?.has_active_lease);
  const navigation = useMemo(() => {
    const items = [
      { name: 'Dashboard', href: routes.adminRoot, icon: LayoutDashboard },
      { name: 'Buildings', href: routes.adminBuildings, icon: Building2 },
      {
        name: 'Building Requests',
        href: routes.adminBuildingRequests,
        icon: ClipboardList,
      },
      { name: 'Rental Requests', href: routes.adminRentalRequests, icon: FileText },
      { name: 'Chat', href: routes.adminChat, icon: MessageSquare },
    ];

    if (isLandlordOrManager) {
      items.splice(3, 0, {
        name: 'Expenses',
        href: routes.adminExpenses,
        icon: ReceiptText,
      });
      items.splice(5, 0, {
        name: 'Maintenance',
        href: routes.adminMaintenance,
        icon: Wrench,
      });
    }

    if (isPlatformAdmin) {
      items.splice(2, 0, { name: 'Users', href: routes.adminUsers, icon: UserRound });
    }

    if (canSwitchToTenantDashboard) {
      items.push({ name: 'Tenant Dashboard', href: routes.tenantRoot, icon: KeyRound });
    }

    return items;
  }, [canSwitchToTenantDashboard, isLandlordOrManager, isPlatformAdmin]);

  if (!authToken) {
    return (
      <Navigate
        to={withRedirect(routes.login, `${location.pathname}${location.search}`)}
        replace
      />
    );
  }

  if (meQuery.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  if (meQuery.error) {
    return (
      <Navigate
        to={withRedirect(routes.login, `${location.pathname}${location.search}`)}
        replace
      />
    );
  }

  if (!hasAdminDashboardAccess(currentRole, dashboardContext)) {
    return (
      <Navigate
        to={routeForDashboard(dashboardContext?.primary_dashboard ?? 'home')}
        replace
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div
        className={`lg:hidden fixed top-0 left-0 right-0 z-40 border-b ${sidebarTheme.mobile} ${sidebarTheme.shell}`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className={`text-xl ${sidebarTheme.brand}`}>Tenanta</h1>
            <p className={`text-xs ${sidebarTheme.muted}`}>{roleLabel}</p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`rounded-lg p-2 transition-colors ${sidebarTheme.hover}`}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className={`lg:hidden fixed inset-0 z-30 pt-16 ${sidebarTheme.mobile}`}>
          <nav className="px-4 py-6 space-y-2">
            <div className="mb-4 px-4">
              <p
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${sidebarTheme.badge}`}
              >
                {roleLabel}
              </p>
            </div>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.href ||
                (item.href !== routes.adminRoot &&
                  location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? sidebarTheme.active
                      : sidebarTheme.hover
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${sidebarTheme.hover}`}
            >
              <LogOut size={20} />
              <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        data-testid="admin-sidebar"
        className={`hidden lg:block fixed left-0 top-0 bottom-0 w-64 border-r ${sidebarTheme.shell}`}
      >
        <div className="p-6">
          <h1 className={`text-2xl ${sidebarTheme.brand}`}>Tenanta</h1>
          <p className={`mt-1 text-sm ${sidebarTheme.muted}`}>Dashboard</p>
          <p
            className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${sidebarTheme.badge}`}
          >
            {roleLabel}
          </p>
        </div>
        <nav className="px-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.href ||
              (item.href !== routes.adminRoot &&
                location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? sidebarTheme.active
                    : sidebarTheme.hover
                }`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={logout}
            className={`mt-4 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${sidebarTheme.hover}`}
          >
            <LogOut size={20} />
            <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
