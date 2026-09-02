"use client";

import { useRef } from "react";
import { Volume2Icon } from "@animateicons/react/lucide";
import { Button } from "@/components/ui/button";
import { speak } from "@/lib/client";

type IconHandle = { startAnimation: () => void; stopAnimation: () => void };

type Props = {
  /** Text to pronounce via the browser's Text-to-Speech. */
  text: string;
  lang?: string;
  /** Button size variant. */
  size?: "icon-xs" | "icon-sm" | "icon" | "icon-lg";
  iconSize?: number;
  /** Stop the click from bubbling (e.g. inside a clickable flashcard). */
  stopPropagation?: boolean;
  title?: string;
  className?: string;
};

/** Ghost icon button that speaks `text` and plays an animated volume icon. */
export function SpeakButton({
  text,
  lang,
  size = "icon-sm",
  iconSize = 18,
  stopPropagation,
  title = "Speak",
  className,
}: Props) {
  const ref = useRef<IconHandle>(null);

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      className={className}
      title={title}
      onMouseEnter={() => ref.current?.startAnimation()}
      onMouseLeave={() => ref.current?.stopAnimation()}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        ref.current?.startAnimation();
        speak(text, lang);
        window.setTimeout(() => ref.current?.stopAnimation(), 900);
      }}
    >
      <Volume2Icon ref={ref} size={iconSize} />
    </Button>
  );
}
