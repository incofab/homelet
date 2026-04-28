import { MaintenanceRequestDetailView } from '../../components/MaintenanceRequestDetailView';
import { routes } from '../../lib/urls';

export function MaintenanceRequestDetail() {
  return (
    <MaintenanceRequestDetailView
      parentTo={routes.adminMaintenance}
      parentLabel="Maintenance"
      canUpdateStatus
    />
  );
}
