import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-4 sm:mb-6', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            {Icon && (
              <Icon className="h-5 w-5 sm:h-7 sm:w-7 text-muted-foreground" />
            )}
            <span>{title}</span>
          </h1>
          {description && (
            <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
