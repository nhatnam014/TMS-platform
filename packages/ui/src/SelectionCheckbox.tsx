import { useEffect, useRef } from "react";

interface SelectionCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  ariaLabel: string;
}

export function SelectionCheckbox({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel,
}: SelectionCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      style={{ width: 16, height: 16, cursor: "pointer" }}
    />
  );
}
