import { useCallback, useMemo, useState } from "react";

export interface UseRowSelectionResult {
  selected: Set<string>;
  selectedCount: number;
  isSelected: (id: string) => boolean;
  isAllSelected: boolean;
  toggle: (id: string) => void;
  toggleAll: () => void;
  clear: () => void;
}

export function useRowSelection(ids: string[]): UseRowSelectionResult {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isAllSelected = ids.length > 0 && ids.every((id) => selected.has(id));

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      return allSelected ? new Set() : new Set(ids);
    });
  }, [ids]);

  const clear = useCallback(() => setSelected(new Set()), []);

  return useMemo(
    () => ({
      selected,
      selectedCount: selected.size,
      isSelected,
      isAllSelected,
      toggle,
      toggleAll,
      clear,
    }),
    [selected, isSelected, isAllSelected, toggle, toggleAll, clear],
  );
}
