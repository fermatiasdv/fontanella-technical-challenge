interface TableSkeletonProps {
  variant?: 'clients' | 'default';
}

export function TableSkeleton({ variant = 'default' }: TableSkeletonProps) {
  const cls =
    variant === 'clients'
      ? 'table-skeleton table-skeleton--clients anim-pulse'
      : 'table-skeleton anim-pulse';
  return <div className={cls} />;
}
