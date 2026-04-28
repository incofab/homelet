import { Link } from 'react-router';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';

export type AppBreadcrumbItem = {
  label: string;
  to?: string;
};

type AppBreadcrumbsProps = {
  items: AppBreadcrumbItem[];
  className?: string;
};

export function AppBreadcrumbs({ items, className = '' }: AppBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <Breadcrumb
      className={`inline-flex max-w-full rounded-lg border border-border bg-card px-3 py-2 shadow-sm ${className}`}
    >
      <BreadcrumbList className="gap-1.5 text-xs sm:text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem>
                {item.to && !isLast ? (
                  <BreadcrumbLink asChild className="font-medium">
                    <Link to={item.to}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="font-medium">
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast ? <BreadcrumbSeparator /> : null}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
