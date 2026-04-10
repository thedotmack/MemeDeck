import type { BoundStore } from "@/lib/store";
import { useStore } from "@/lib/store";

export function useFooterAmount(): number {
  return useStore((state: BoundStore) => state.ui?.selectedDrawAmount ?? 0);
}
