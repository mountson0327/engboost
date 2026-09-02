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
  SparklesIcon,
} from "@animateicons/react/lucide";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
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
      className="ml-auto flex items-center rounded-lg border p-0.5"
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

export default function Nav() {
  const pathname = usePathname();
  const logoRef = useRef<IconHandle>(null);
  const { t } = useI18n();

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
        <LanguageToggle />
      </nav>
    </header>
  );
}
