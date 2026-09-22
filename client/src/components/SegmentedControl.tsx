import { motion } from "framer-motion";

interface SegmentedControlProps {
  options: { label: string; value: string; icon: React.ReactNode; count?: number }[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div className="flex p-1 bg-secondary/50 backdrop-blur-sm rounded-2xl relative border border-white/5 shadow-inner">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              relative flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-xl transition-colors duration-200 z-10
              ${isActive ? "text-white" : "text-muted-foreground hover:text-white/70"}
            `}
          >
            {isActive && (
              <motion.div
                layoutId="activeSegment"
                className="absolute inset-0 bg-secondary rounded-xl shadow-lg border border-white/10"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-20 flex items-center gap-2">
              {option.icon}
              <span className="hidden sm:inline">{option.label}</span>
              {option.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-md ml-0.5 tabular-nums transition-colors ${
                  isActive ? "bg-white/10 text-white" : "bg-white/5 text-muted-foreground"
                }`}>
                  {option.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
