import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
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
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              "w-full appearance-none bg-white border border-[#C6C6C8] rounded-xl px-4 py-2.5 pr-10",
              "text-[15px] text-[#1C1C1E]",
              "focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20",
              "transition-all duration-150",
              error && "border-[#FF3B30] focus:border-[#FF3B30]",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8E8E93]">
            <ChevronDown size={16} />
          </div>
        </div>
        {error && <p className="text-[13px] text-[#FF3B30]">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
