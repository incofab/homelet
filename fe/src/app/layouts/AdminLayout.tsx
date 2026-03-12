import { Outlet, Link, useLocation } from 'react-router';
import {
  Building2,
  LayoutDashboard,
  Users,
  UserRound,
  DollarSign,
  Wrench,
  FileText,
  MessageSquare,
  Menu,
  X,
  LogOut,
  ClipboardList,
  KeyRound,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { api, routes } from '../lib/urls';
import { useApiQuery } from '../hooks/useApiQuery';
import type { DashboardContext } from '../lib/responses';
import { useAuthSession } from '../hooks/useAuthSession';

type MeResponse = {
  user?: { role?: string };
  dashboard_context?: DashboardContext;
};

export function AdminLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout, loggingOut } = useAuthSession();
  const selectProfile = useCallback((data: MeResponse) => data, []);
  const meQuery = useApiQuery<MeResponse, MeResponse>(api.authMe, {
    select: selectProfile,
  });
  const isPlatformAdmin = meQuery.data?.user?.role === 'admin';
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
      { name: 'Tenants', href: routes.adminTenants, icon: Users },
      { name: 'Payments', href: routes.adminPayments, icon: DollarSign },
      { name: 'Maintenance', href: routes.adminMaintenance, icon: Wrench },
      { name: 'Rental Requests', href: routes.adminRentalRequests, icon: FileText },
      { name: 'Chat', href: routes.adminChat, icon: MessageSquare },
    ];

    if (isPlatformAdmin) {
      items.splice(4, 0, { name: 'Users', href: routes.adminUsers, icon: UserRound });
    }

    if (canSwitchToTenantDashboard) {
      items.push({ name: 'Tenant Dashboard', href: routes.tenantRoot, icon: KeyRound });
    }

    return items;
  }, [canSwitchToTenantDashboard, isPlatformAdmin]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl text-primary">Tenanta</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-muted rounded-lg"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-card pt-16">
          <nav className="px-4 py-6 space-y-2">
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
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
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
              className="flex w-full items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-muted text-left"
            >
              <LogOut size={20} />
              <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border">
        <div className="p-6">
          <h1 className="text-2xl text-primary">Tenanta</h1>
          <p className="text-sm text-muted-foreground mt-1">Dashboard</p>
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
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
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
            className="mt-4 flex w-full items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-muted text-left"
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
