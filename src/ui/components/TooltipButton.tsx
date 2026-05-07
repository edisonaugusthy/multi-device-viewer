import type { ButtonHTMLAttributes, ReactNode } from "react";

interface TooltipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  variant?: "ghost" | "solid" | "soft" | "danger";
}

export function TooltipButton({ label, children, variant = "ghost", className = "", ...props }: TooltipButtonProps) {
  const variants = {
    ghost: "border border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    solid: "border border-teal-700 bg-teal-700 text-white hover:bg-teal-800",
    soft: "border border-teal-100 bg-teal-50 text-teal-800 hover:bg-teal-100",
    danger: "border border-red-100 bg-red-50 text-red-700 hover:bg-red-100"
  };

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex h-9 min-w-9 items-center justify-center gap-2 rounded-[8px] px-2.5 text-[13px] font-semibold transition ${variants[variant]} disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
