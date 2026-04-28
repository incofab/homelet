import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { AppBreadcrumbs } from '../../components/AppBreadcrumbs';
import { Home } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { apiPost, setAuthToken } from '../../lib/api';
import { env } from '../../lib/env';
import { clearImpersonationState } from '../../lib/impersonation';
import {
  api,
  getRedirectTarget,
  getRequestedRedirect,
  routeForDashboard,
  routes,
  withRedirect,
} from '../../lib/urls';
import type { AuthResponse } from '../../lib/responses';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formState, setFormState] = useState({ identifier: '', password: '' });
  const [status, setStatus] = useState<{
    type: 'idle' | 'error';
    message?: string;
  }>({ type: 'idle' });
  const [submitting, setSubmitting] = useState(false);
  const requestedRedirect = getRequestedRedirect(location.search);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: 'idle' });

    try {
      const data = await apiPost<AuthResponse>(api.authLogin, formState);
      clearImpersonationState();
      setAuthToken(data.token);
      navigate(
        getRedirectTarget(location.search, routeForDashboard(data.dashboard)),
      );
    } catch (error) {
      setStatus({
        type: 'error',
        message: (error as Error).message || 'Unable to sign in.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <AppBreadcrumbs
            items={[{ label: 'Home', to: routes.root }, { label: 'Login' }]}
          />
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Home size={32} className="text-primary" />
            <span className="text-3xl text-primary">{env.appName}</span>
          </div>
          <h1 className="text-2xl mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              type="text"
              label="Email or Phone"
              placeholder="you@example.com or 08012345678"
              value={formState.identifier}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  identifier: event.target.value,
                }))
              }
              required
            />
            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={formState.password}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
              required
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-primary hover:underline">
                Forgot password?
              </a>
            </div>

            {status.type === 'error' && (
              <p className="text-sm text-destructive">{status.message}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              Don't have an account?{' '}
            </span>
            <Link
              to={
                requestedRedirect
                  ? withRedirect(routes.register, requestedRedirect)
                  : routes.register
              }
              className="text-primary hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
