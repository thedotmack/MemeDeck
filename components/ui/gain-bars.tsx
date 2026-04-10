"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface GainBarsProps {
  data: Array<{
    label: string;
    value: number | null;
  }>;
  className?: string;
}

export function GainBars({ data, className }: GainBarsProps) {
  const maxAbsValue = Math.max(...data.map((d) => Math.abs(d.value || 0)));
  const scale = maxAbsValue > 0 ? 50 / maxAbsValue : 1; 

  return (
    <div className={cn("flex items-center justify-between h-full w-full gap-1", className)}>
      {data.map((item) => {
        const value = item.value || 0;
        const height = Math.abs(value) * scale;
        const isPositive = value >= 0;

        return (
          <div key={item.label} className="flex-1 flex flex-col items-center h-full justify-center relative">
            {}
            <div className="absolute w-full h-[1px] bg-gray-600/20 top-1/2 -translate-y-1/2" />
            
            {}
            <div className="w-full h-full flex flex-col items-center justify-center">
              {}
              <div className="relative h-full w-[90%] flex items-center justify-center">
                <motion.div
                  className={cn(
                    "w-9/12 rounded-xs absolute",
                    isPositive ? "bg-green-300 bottom-1/2" : "bg-red-300 top-1/2"
                  )}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    duration: 0.3
                  }}
                />
              </div>
              
              {}
              <span className="text-[8px] text-muted-foreground mt-1">{item.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}