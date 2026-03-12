import { Search, Shield, Users } from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { Navigate } from "react-router";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { useApiQuery } from "../../hooks/useApiQuery";
import type { UserProfile } from "../../lib/models";
import { PaginatedData } from "../../lib/paginatedData";
import { api, routes } from "../../lib/urls";

type PlatformUser = UserProfile & {
  email?: string;
  phone?: string | null;
  role?: string;
};

export function UsersList() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const selectCurrentUser = useCallback((data: { user?: { role?: string } }) => data.user ?? {}, []);
  const selectUsers = useCallback((data: unknown) => PaginatedData.from<PlatformUser>(data, "users"), []);
  const meQuery = useApiQuery<{ user?: { role?: string } }, { role?: string }>(api.authMe, {
    select: selectCurrentUser,
  });
  const isPlatformAdmin = meQuery.data?.role === "admin";

  const usersPath = useMemo(() => {
    const query = deferredSearch ? `?q=${encodeURIComponent(deferredSearch)}` : "";
    return `${api.users}${query}`;
  }, [deferredSearch]);

  const usersQuery = useApiQuery<unknown, PaginatedData<PlatformUser>>(usersPath, {
    enabled: isPlatformAdmin,
    select: selectUsers,
    deps: [usersPath, isPlatformAdmin],
  });

  const users = usersQuery.data?.items ?? [];

  if (!meQuery.loading && !isPlatformAdmin) {
    return <Navigate to={routes.adminRoot} replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Users</h1>
        <p className="text-muted-foreground">Search and review platform user accounts.</p>
      </div>

      <Card>
        <label className="block text-sm mb-2 text-foreground">Search users</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="search"
            placeholder="Search by name, email, or phone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </Card>

      <Card>
        {usersQuery.loading ? (
          <p className="text-muted-foreground">Loading users...</p>
        ) : usersQuery.error ? (
          <p className="text-sm text-destructive">{usersQuery.error}</p>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<Users size={28} className="text-muted-foreground" />}
            title="No users found"
            description="Try a different search term."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Contact</th>
                  <th className="text-left py-3 px-4">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users size={18} className="text-primary" />
                        </div>
                        <div>
                          <p>{user.name}</p>
                          <p className="text-sm text-muted-foreground">#{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <p className="text-muted-foreground">{user.email ?? "—"}</p>
                        <p className="text-muted-foreground">{user.phone ?? "—"}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-2">
                        <Shield size={14} className="text-primary" />
                        <StatusBadge status={(user.role ?? "user").toUpperCase()} type="request" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
