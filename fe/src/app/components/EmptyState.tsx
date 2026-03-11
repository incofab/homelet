import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        {icon}
      </div>
      <h3 className="text-xl mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md mx-auto">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
