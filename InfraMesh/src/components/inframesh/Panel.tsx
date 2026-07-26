import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  noPadding,
  variant = "default",
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  variant?: "default" | "danger";
}) {
  return (
    <div
      className={cn(
        "panel overflow-hidden",
        variant === "danger" && "border-destructive/30",
        className,
      )}
    >
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-border/40 px-5 py-4">
          <div>
            {title && (
              <h3 className="text-sm font-medium text-foreground">{title}</h3>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {noPadding ? children : <div className="p-5">{children}</div>}
    </div>
  );
}
