import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
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

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
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
      const data = await apiPost<AuthResponse>(api.authRegister, formState);
      clearImpersonationState();
      setAuthToken(data.token);
      navigate(getRedirectTarget(location.search, routeForDashboard(data.dashboard)));
    } catch (error) {
      setStatus({
        type: 'error',
        message: (error as Error).message || 'Unable to register.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Home size={32} className="text-primary" />
            <span className="text-3xl text-primary">{env.appName}</span>
          </div>
          <h1 className="text-2xl mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join {env.appName} today</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              type="text"
              label="Full Name"
              placeholder="Jane Doe"
              value={formState.name}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
            <Input
              type="email"
              label="Email (Optional)"
              placeholder="you@example.com"
              value={formState.email}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, email: event.target.value }))
              }
            />
            <Input
              type="tel"
              label="Phone"
              placeholder="1234567890"
              value={formState.phone}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, phone: event.target.value }))
              }
              required
            />
            <Input
              type="password"
              label="Password"
              placeholder="Create a password"
              value={formState.password}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
              required
            />
            <Input
              type="password"
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formState.password_confirmation}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  password_confirmation: event.target.value,
                }))
              }
              required
            />

            {status.type === 'error' && (
              <p className="text-sm text-destructive">{status.message}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              Already have an account?{' '}
            </span>
            <Link
              to={
                requestedRedirect
                  ? withRedirect(routes.login, requestedRedirect)
                  : routes.login
              }
              className="text-primary hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to={routes.root}>
            <Button variant="ghost">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
