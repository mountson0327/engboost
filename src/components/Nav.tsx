"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import {
  LayersIcon,
  RepeatIcon,
  ActivityIcon,
  BookOpenIcon,
  MessageCircleIcon,
  FilePenIcon,
  SparklesIcon,
  SettingsIcon,
} from "@animateicons/react/lucide";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/lib/auth-client";
import { LANGS, type Lang, type TKey } from "@/lib/i18n/dictionaries";

// All @animateicons handles share this shape.
type IconHandle = { startAnimation: () => void; stopAnimation: () => void };
type AnimatedIcon = React.ForwardRefExoticComponent<
  { size?: number } & React.RefAttributes<IconHandle>
>;

const LINKS: { href: string; labelKey: TKey; Icon: AnimatedIcon }[] = [
  { href: "/decks", labelKey: "nav.decks", Icon: LayersIcon as AnimatedIcon },
  { href: "/read", labelKey: "nav.read", Icon: BookOpenIcon as AnimatedIcon },
  { href: "/chat", labelKey: "nav.chat", Icon: MessageCircleIcon as AnimatedIcon },
  { href: "/write", labelKey: "nav.write", Icon: FilePenIcon as AnimatedIcon },
  { href: "/review", labelKey: "nav.review", Icon: RepeatIcon as AnimatedIcon },
  { href: "/quiz", labelKey: "nav.quiz", Icon: ActivityIcon as AnimatedIcon },
];

function NavItem({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: AnimatedIcon;
  active: boolean;
}) {
  const ref = useRef<IconHandle>(null);
  return (
    <Link
      href={href}
      onMouseEnter={() => ref.current?.startAnimation()}
      onMouseLeave={() => ref.current?.stopAnimation()}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon ref={ref} size={18} />
      <span>{label}</span>
    </Link>
  );
}

function SettingsLink({ active }: { active: boolean }) {
  const ref = useRef<IconHandle>(null);
  const { t } = useI18n();
  return (
    <Link
      href="/settings"
      title={t("nav.settings")}
      aria-label={t("nav.settings")}
      onMouseEnter={() => ref.current?.startAnimation()}
      onMouseLeave={() => ref.current?.stopAnimation()}
      className={cn(
        "flex items-center rounded-lg p-1.5 transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <SettingsIcon ref={ref} size={18} />
    </Link>
  );
}

function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      className="flex items-center rounded-lg border p-0.5"
      title={t("nav.language")}
    >
      {LANGS.map((l: Lang) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-semibold uppercase transition-colors",
            lang === l
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function UserArea() {
  const { t } = useI18n();
  const { user, effectiveRole, viewMode, setViewMode, logout } = useAuth();
  if (!user) return null;
  const isAdmin = user.role === "admin";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-semibold",
          effectiveRole === "admin"
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground",
        )}
        title={user.email}
      >
        {t(effectiveRole === "admin" ? "role.admin" : "role.user")}
      </span>
      {isAdmin && (
        <>
          <Link
            href="/admin"
            className="rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {t("nav.admin")}
          </Link>
          <button
            onClick={() => setViewMode(viewMode === "user" ? "admin" : "user")}
            className="rounded-lg border px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {viewMode === "user" ? t("auth.backToAdmin") : t("auth.viewAsUser")}
          </button>
        </>
      )}
      <button
        onClick={logout}
        className="rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground hover:text-danger"
      >
        {t("auth.logout")}
      </button>
    </div>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const logoRef = useRef<IconHandle>(null);
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex items-center px-4 py-3 gap-2">
        <Link
          href="/"
          onMouseEnter={() => logoRef.current?.startAnimation()}
          onMouseLeave={() => logoRef.current?.stopAnimation()}
          className="mr-3 flex items-center gap-2 text-lg font-bold"
        >
          <SparklesIcon ref={logoRef} size={22} />
          <span>EngBoost</span>
        </Link>
        {user && (
          <div className="flex flex-wrap gap-1">
            {LINKS.map((l) => (
              <NavItem
                key={l.href}
                href={l.href}
                label={t(l.labelKey)}
                Icon={l.Icon}
                active={pathname.startsWith(l.href)}
              />
            ))}
          </div>
        )}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <LanguageToggle />
          {user && <SettingsLink active={pathname.startsWith("/settings")} />}
          <UserArea />
        </div>
      </nav>
    </header>
  );
}
