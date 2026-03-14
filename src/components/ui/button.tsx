"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]";

    const variants = {
      primary:
        "bg-[#007AFF] text-white hover:bg-[#0071E3] focus-visible:ring-[#007AFF] shadow-sm",
      secondary:
        "bg-[#F2F2F7] text-[#1C1C1E] hover:bg-[#E5E5EA] focus-visible:ring-[#8E8E93]",
      ghost:
        "text-[#007AFF] hover:bg-[#F2F2F7] focus-visible:ring-[#007AFF]",
      danger:
        "bg-[#FF3B30] text-white hover:bg-[#E5352A] focus-visible:ring-[#FF3B30] shadow-sm",
      outline:
        "border border-[#C6C6C8] text-[#1C1C1E] hover:bg-[#F2F2F7] focus-visible:ring-[#007AFF] bg-white",
    };

    const sizes = {
      sm: "text-[13px] px-3 py-1.5 rounded-lg",
      md: "text-[15px] px-5 py-2.5",
      lg: "text-[17px] px-7 py-3.5",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
