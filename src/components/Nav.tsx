"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayersIcon,
  RepeatIcon,
  ActivityIcon,
  BookOpenIcon,
  MessageCircleIcon,
  FilePenIcon,
  SparklesIcon,
  SettingsIcon,
  UserIcon,
  ShieldCheckIcon,
  EyeIcon,
  LogOutIcon,
} from "@animateicons/react/lucide";
import { ChevronDown } from "lucide-react";
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

/** One row in the user dropdown — its icon animates on hover. */
function MenuItem({
  Icon,
  label,
  href,
  onClick,
  danger,
}: {
  Icon: AnimatedIcon;
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const ref = useRef<IconHandle>(null);
  const cls = cn(
    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
    danger
      ? "text-muted-foreground hover:bg-danger/10 hover:text-danger"
      : "text-muted-foreground hover:bg-accent hover:text-foreground",
  );
  const handlers = {
    onMouseEnter: () => ref.current?.startAnimation(),
    onMouseLeave: () => ref.current?.stopAnimation(),
  };
  const inner = (
    <>
      <Icon ref={ref} size={16} />
      <span>{label}</span>
    </>
  );
  return href ? (
    <Link href={href} className={cls} onClick={onClick} {...handlers}>
      {inner}
    </Link>
  ) : (
    <button type="button" className={cls} onClick={onClick} {...handlers}>
      {inner}
    </button>
  );
}

function UserMenu() {
  const { t } = useI18n();
  const { user, effectiveRole, viewMode, setViewMode, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const userIconRef = useRef<IconHandle>(null);

  // Close on click outside / Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  const isAdmin = user.role === "admin";

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => userIconRef.current?.startAnimation()}
        onMouseLeave={() => userIconRef.current?.stopAnimation()}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-2 py-1 text-sm font-medium transition-colors",
          open
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <UserIcon ref={userIconRef} size={16} />
        <span
          className={cn(
            effectiveRole === "admin" && "font-semibold text-primary",
          )}
        >
          {t(effectiveRole === "admin" ? "role.admin" : "role.user")}
        </span>
        <ChevronDown
          size={14}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1.5 w-56 rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="truncate px-2.5 py-1.5 text-xs text-muted-foreground">
            {user.email}
          </div>
          <div className="my-1 h-px bg-border" />
          <MenuItem
            Icon={SettingsIcon as AnimatedIcon}
            label={t("nav.settings")}
            href="/settings"
            onClick={() => setOpen(false)}
          />
          {isAdmin && (
            <MenuItem
              Icon={ShieldCheckIcon as AnimatedIcon}
              label={t("nav.admin")}
              href="/admin"
              onClick={() => setOpen(false)}
            />
          )}
          {isAdmin && (
            <MenuItem
              Icon={EyeIcon as AnimatedIcon}
              label={
                viewMode === "user"
                  ? t("auth.backToAdmin")
                  : t("auth.viewAsUser")
              }
              onClick={() => {
                setViewMode(viewMode === "user" ? "admin" : "user");
                setOpen(false);
              }}
            />
          )}
          <MenuItem
            Icon={LogOutIcon as AnimatedIcon}
            label={t("auth.logout")}
            danger
            onClick={() => {
              logout();
              setOpen(false);
            }}
          />
        </div>
      )}
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
      <nav className="flex items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
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
          <UserMenu />
        </div>
      </nav>
    </header>
  );
}
