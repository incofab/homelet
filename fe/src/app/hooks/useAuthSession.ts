import { useState } from 'react';
import { useNavigate } from 'react-router';
import { apiPost, setAuthToken } from '../lib/api';
import {
  clearImpersonationState,
  getImpersonationState,
} from '../lib/impersonation';
import { api, routes } from '../lib/urls';

export function useAuthSession() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [stoppingImpersonation, setStoppingImpersonation] = useState(false);

  const logout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await apiPost(api.authLogout);
    } catch (error) {
      // ignore network errors on logout
    } finally {
      clearImpersonationState();
      setAuthToken(null);
      navigate(routes.login);
      setLoggingOut(false);
    }
  };

  const stopImpersonation = async () => {
    const impersonation = getImpersonationState();

    if (!impersonation || stoppingImpersonation) {
      return false;
    }

    setStoppingImpersonation(true);

    try {
      await apiPost(api.authLogout);
    } catch (error) {
      // ignore network errors while stopping impersonation
    } finally {
      setAuthToken(impersonation.originalToken);
      clearImpersonationState();
      // navigate(routes.adminRoot);
      window.location.href = routes.adminRoot;
      setStoppingImpersonation(false);
    }

    return true;
  };

  return {
    loggingOut,
    logout,
    stoppingImpersonation,
    stopImpersonation,
  };
}
