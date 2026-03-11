interface StatusBadgeProps {
  status: string;
  type?: 'apartment' | 'lease' | 'payment' | 'maintenance' | 'request';
}

export function StatusBadge({ status, type = 'apartment' }: StatusBadgeProps) {
  const getStyles = () => {
    const normalizedStatus = status.toLowerCase();
    
    if (type === 'apartment') {
      if (normalizedStatus === 'vacant') return 'bg-success/10 text-success border-success/20';
      if (normalizedStatus === 'occupied') return 'bg-muted text-muted-foreground border-border';
      if (normalizedStatus === 'maintenance') return 'bg-warning/10 text-warning border-warning/20';
    }
    
    if (type === 'lease') {
      if (normalizedStatus === 'active') return 'bg-success/10 text-success border-success/20';
      if (normalizedStatus === 'expiring') return 'bg-warning/10 text-warning border-warning/20';
      if (normalizedStatus === 'expired') return 'bg-destructive/10 text-destructive border-destructive/20';
    }
    
    if (type === 'payment') {
      if (normalizedStatus === 'paid') return 'bg-success/10 text-success border-success/20';
      if (normalizedStatus === 'pending') return 'bg-warning/10 text-warning border-warning/20';
      if (normalizedStatus === 'overdue') return 'bg-destructive/10 text-destructive border-destructive/20';
    }
    
    if (type === 'maintenance') {
      if (normalizedStatus === 'pending') return 'bg-warning/10 text-warning border-warning/20';
      if (normalizedStatus === 'in progress') return 'bg-info/10 text-info border-info/20';
      if (normalizedStatus === 'completed') return 'bg-success/10 text-success border-success/20';
    }
    
    if (type === 'request') {
      if (normalizedStatus === 'pending') return 'bg-warning/10 text-warning border-warning/20';
      if (normalizedStatus === 'new') return 'bg-info/10 text-info border-info/20';
      if (normalizedStatus === 'contacted') return 'bg-warning/10 text-warning border-warning/20';
      if (normalizedStatus === 'approved') return 'bg-success/10 text-success border-success/20';
      if (normalizedStatus === 'rejected') return 'bg-destructive/10 text-destructive border-destructive/20';
    }
    
    return 'bg-muted text-muted-foreground border-border';
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${getStyles()}`}>
      {status}
    </span>
  );
}
