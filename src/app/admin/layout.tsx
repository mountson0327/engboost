"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/lib/auth-client";
import type { TKey } from "@/lib/i18n/dictionaries";

const ITEMS: { href: string; labelKey: TKey; Icon: typeof Users }[] = [
  { href: "/admin", labelKey: "admin.overview", Icon: LayoutDashboard },
  { href: "/admin/users", labelKey: "admin.users", Icon: Users },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { user, loading } = useAuth();

  if (!loading && user && user.role !== "admin") {
    return <p className="text-muted-foreground">403 — {t("admin.forbidden")}</p>;
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Sidebar */}
      <aside className="md:w-56 md:shrink-0">
        <div className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("admin.panel")}
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {ITEMS.map(({ href, labelKey, Icon }) => {
            const active =
              href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon size={16} />
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
