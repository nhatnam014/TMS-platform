import type { ContainerSize } from "@tms/shared";

const SIZE_MAP: Record<string, ContainerSize> = {
  "20GP": "GP20", "20'GP": "GP20", "20": "GP20",
  "40HC": "HC40", "40HQ": "HC40", "40'HC": "HC40",
  "40GP": "GP40", "40'": "GP40",
  "45HC": "HC45", "45HQ": "HC45", "45": "HC45",
};

export function normalizeContainerSize(
  sizeStr: string,
  flag20: string,
  flag40: string,
  flag45: string,
): ContainerSize | null {
  const normalized = sizeStr?.trim().toUpperCase();
  if (normalized && SIZE_MAP[normalized]) return SIZE_MAP[normalized];

  const f = (v: string) => v?.trim().toUpperCase();
  if (!normalized) {
    if (f(flag20) === "X") return "GP20";
    if (f(flag45) === "X") return "HC45";
    if (f(flag40) === "X") return "HC40";
  }
  return null;
}
