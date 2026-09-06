import { cn } from "@/lib/utils";

/** Centered empty/no-data placeholder used across the app. */
export function EmptyState({
  message,
  icon,
  action,
  className,
}: {
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground",
        className,
      )}
    >
      {icon && <div className="opacity-70">{icon}</div>}
      <p className="text-sm">{message}</p>
      {action}
    </div>
  );
}
