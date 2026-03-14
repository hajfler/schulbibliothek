import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "blue" | "green" | "red" | "orange" | "gray" | "purple";
  className?: string;
}

const variants = {
  blue: "bg-[#E1F0FF] text-[#007AFF]",
  green: "bg-[#E3F9E8] text-[#28A745]",
  red: "bg-[#FFE9E9] text-[#FF3B30]",
  orange: "bg-[#FFF3E0] text-[#FF9500]",
  gray: "bg-[#F2F2F7] text-[#8E8E93]",
  purple: "bg-[#F3E8FF] text-[#AF52DE]",
};

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
