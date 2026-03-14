"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightElement, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-semibold text-[#3A3A3C] uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-[#8E8E93] pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full bg-white border border-[#C6C6C8] rounded-xl px-4 py-2.5",
              "text-[15px] text-[#1C1C1E] placeholder:text-[#C7C7CC]",
              "focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20",
              "transition-all duration-150",
              leftIcon && "pl-10",
              rightElement && "pr-10",
              error && "border-[#FF3B30] focus:border-[#FF3B30] focus:ring-[#FF3B30]/20",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3">{rightElement}</div>
          )}
        </div>
        {error && (
          <p className="text-[13px] text-[#FF3B30]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-[13px] text-[#8E8E93]">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
