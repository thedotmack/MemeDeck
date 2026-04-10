import { cn } from "@/lib/utils";
import { TooltipData, TooltipDetail } from "@/lib/types/tooltip-types";
import { useMemo } from "react";

interface TooltipContentProps {
  data: TooltipData | (() => TooltipData);
}

export function TooltipContent({ data }: TooltipContentProps) {
  const tooltipData = useMemo(() => {
    return typeof data === 'function' ? data() : data;
  }, [data]);
  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'green':
        return 'text-green-400';
      case 'red':
        return 'text-red-400';
      case 'blue':
        return 'text-blue-400';
      case 'yellow':
        return 'text-yellow-400';
      case 'purple':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {tooltipData.icon && <span className="text-lg">{tooltipData.icon}</span>}
        <span className={cn("font-semibold", getColorClasses(tooltipData.color))}>{tooltipData.title}</span>
      </div>
      
      <div className="text-gray-300 text-sm">{tooltipData.description}</div>
      
      {tooltipData.details && tooltipData.details.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-gray-700">
          {tooltipData.details.map((detail) => (
            <div key={detail.label} className="flex justify-between items-center text-sm">
              <span className="text-gray-400">{detail.label}:</span>
              <span className={cn("font-medium flex items-center gap-1", getColorClasses(detail.color))}>
                {detail.icon && <span>{detail.icon}</span>}
                {detail.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}