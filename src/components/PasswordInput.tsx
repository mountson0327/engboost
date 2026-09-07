"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  showLabel?: string;
  hideLabel?: string;
  inputClassName?: string;
};

/** Password field with an accessible show/hide toggle. */
export function PasswordInput({
  className,
  inputClassName,
  showLabel = "Show password",
  hideLabel = "Hide password",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);
  const label = visible ? hideLabel : showLabel;

  return (
    <div className={cn("relative w-full", className)}>
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-11", inputClassName)}
      />
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
        onMouseDown={(event) => event.preventDefault()}
        className="absolute inset-y-0 right-1.5 my-auto grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/20 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
