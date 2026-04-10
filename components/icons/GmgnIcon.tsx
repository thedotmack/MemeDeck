import Image from "next/image";

import { cn } from "@/lib/utils";

interface GmgnIconProps {
  className?: string;
  size?: number;
}

export function GmgnIcon({ className, size = 18 }: GmgnIconProps) {
  return (
    <Image
      src="/gmgn-icon.svg"
      alt=""
      width={size}
      height={size}
      className={cn("object-contain", className)}
    />
  );
}
