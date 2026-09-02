"use client";

import Link from "next/link";
import { useRef } from "react";
import { PlayIcon } from "@animateicons/react/lucide";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IconHandle = { startAnimation: () => void; stopAnimation: () => void };

/** A Link styled as a primary button with an animated play icon (hover). */
export function ReviewLink({
  href,
  label,
  variant,
  className,
}: {
  href: string;
  label: string;
  variant?: "default" | "outline";
  className?: string;
}) {
  const ref = useRef<IconHandle>(null);
  return (
    <Link
      href={href}
      onMouseEnter={() => ref.current?.startAnimation()}
      onMouseLeave={() => ref.current?.stopAnimation()}
      className={cn(
        buttonVariants({ variant: variant ?? "default", size: "lg" }),
        "h-10 gap-1.5 px-4",
        className,
      )}
    >
      <PlayIcon ref={ref} size={16} />
      {label}
    </Link>
  );
}
