import { Outlet } from 'react-router';
import { GlobalLoadingIndicator } from '../components/GlobalLoadingIndicator';
import { ImpersonationBanner } from '../components/ImpersonationBanner';
import { Toaster } from '../components/ui/sonner';

export function AppShell() {
  return (
    <>
      <GlobalLoadingIndicator />
      <ImpersonationBanner />
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  );
}
