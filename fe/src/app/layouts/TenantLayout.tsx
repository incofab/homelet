import { Outlet, Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  DollarSign,
  Wrench,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { routes } from '../lib/urls';
import { Button } from '../components/Button';
import { useAuthSession } from '../hooks/useAuthSession';

const navigation = [
  { name: 'Dashboard', href: routes.tenantRoot, icon: LayoutDashboard },
  { name: 'Payments', href: routes.tenantPayments, icon: DollarSign },
  { name: 'Maintenance', href: routes.tenantMaintenance, icon: Wrench },
  { name: 'Chat', href: routes.tenantChat, icon: MessageSquare },
];

export function TenantLayout() {
  const location = useLocation();
  const { logout, loggingOut } = useAuthSession();

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-4 lg:px-8 py-4 flex items-center justify-between gap-4">
          <h1 className="text-xl text-primary">Tenanta</h1>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut size={16} className="mr-2" />
            {loggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="p-4 lg:p-8">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex items-center justify-around px-2 py-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
