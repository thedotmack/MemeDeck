import Image from "next/image";

import { cn } from "@/lib/utils";

interface JupiterIconProps {
  className?: string;
  size?: number;
}

export function JupiterIcon({ className, size = 18 }: JupiterIconProps) {
  return (
    <Image
      src="/jupiter-logo.webp"
      alt=""
      width={size}
      height={size}
      className={cn("object-contain", className)}
    />
  );
}
