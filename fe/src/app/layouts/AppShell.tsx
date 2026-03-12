import { Outlet } from 'react-router';
import { GlobalLoadingIndicator } from '../components/GlobalLoadingIndicator';
import { ImpersonationBanner } from '../components/ImpersonationBanner';

export function AppShell() {
  return (
    <>
      <GlobalLoadingIndicator />
      <ImpersonationBanner />
      <Outlet />
    </>
  );
}
