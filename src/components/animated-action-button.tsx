"use client";

import { useTransition, useState } from "react";

type Variant = "join" | "leave" | "neutral";

const VARIANT_STYLES: Record<Variant, string> = {
  join: "bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700",
  leave: "bg-white/90 text-emerald-700 hover:bg-white active:bg-emerald-50",
  neutral: "bg-white/20 text-white backdrop-blur-sm hover:bg-white/30",
};

const VARIANT_ICON: Record<Variant, string> = {
  join: "M12 5v14M5 12h14",
  leave: "M5 13l4 4L19 7",
  neutral: "",
};

export function AnimatedActionButton({
  action,
  variant,
  label,
  fields,
  className = "",
  iconSize = "h-3 w-3",
  showIcon = true,
  onSuccess,
}: {
  action: (formData: FormData) => Promise<void>;
  variant: Variant;
  label: string;
  fields: { name: string; value: string }[];
  className?: string;
  iconSize?: string;
  showIcon?: boolean;
  onSuccess?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [burst, setBurst] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Pequeña animación de burst al confirmar la acción
    setBurst(true);
    setTimeout(() => setBurst(false), 600);
  };

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await action(formData);
          onSuccess?.();
        });
      }}
    >
      {fields.map((f) => (
        <input key={f.name} type="hidden" name={f.name} value={f.value} />
      ))}
      <button
        type="submit"
        disabled={pending}
        onClick={handleClick}
        className={`relative flex items-center justify-center gap-1 overflow-hidden rounded-full px-2.5 py-1 text-[10px] font-bold transition active:scale-90 disabled:opacity-60 ${VARIANT_STYLES[variant]} ${className}`}
      >
        {/* Burst animation */}
        {burst && (
          <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-current opacity-20" />
        )}
        {showIcon && (
          <svg
            className={`${iconSize} ${pending ? "animate-spin" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={variant === "leave" ? 3 : 2.5}
          >
            {pending ? (
              <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d={VARIANT_ICON[variant]} strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        )}
        <span className="relative">{pending ? "..." : label}</span>
      </button>
    </form>
  );
}
