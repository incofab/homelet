import { Outlet, Link, useLocation, useNavigate } from 'react-router';
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
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { apiPost, setAuthToken } from '../lib/api';
import { api, routes } from '../lib/urls';
import { useApiQuery } from '../hooks/useApiQuery';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const selectCurrentUser = useCallback((data: { user?: { role?: string } }) => data.user ?? {}, []);
  const meQuery = useApiQuery<{ user?: { role?: string } }, { role?: string }>(api.authMe, {
    select: selectCurrentUser,
  });
  const isPlatformAdmin = meQuery.data?.role === 'admin';
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

    return items;
  }, [isPlatformAdmin]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await apiPost(api.authLogout);
    } catch (error) {
      // ignore network errors on logout
    } finally {
      setAuthToken(null);
      navigate(routes.login);
      setLoggingOut(false);
    }
  };

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
                handleLogout();
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
            onClick={handleLogout}
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
