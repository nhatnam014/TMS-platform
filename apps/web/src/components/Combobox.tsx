"use client";

import { useEffect, useRef, useState } from "react";

export interface ComboboxOption {
  value: string;
  label: string;
  amount?: number | null;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  onAmountAutofill?: (amount: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  onAmountAutofill,
  placeholder = "Chọn hoặc nhập...",
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  function calcPos() {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 2, left: rect.left, width: rect.width });
  }

  const filtered =
    query.trim() === "" || options.some((o) => o.label === query)
      ? options
      : options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  function handleSelect(opt: ComboboxOption) {
    setQuery(opt.label);
    onChange(opt.label);
    onAmountAutofill?.(opt.amount ?? null);
    setOpen(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    calcPos();
    setOpen(true);
    if (!options.find((o) => o.label === v)) onAmountAutofill?.(null);
  }

  function handleFocus() {
    calcPos();
    setOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  // Close on outside click (exclude input and the fixed dropdown list)
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!inputRef.current?.contains(t) && !listRef.current?.contains(t)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Reposition on scroll; close only if input scrolled off-screen
  useEffect(() => {
    if (!open) return;
    function onScroll() {
      if (!inputRef.current) {
        setOpen(false);
        return;
      }
      const rect = inputRef.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setOpen(false);
      } else {
        setPos({ top: rect.bottom + 2, left: rect.left, width: rect.width });
      }
    }
    document.addEventListener("scroll", onScroll, true);
    return () => document.removeEventListener("scroll", onScroll, true);
  }, [open]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "7px 10px",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          fontSize: 13,
          boxSizing: "border-box",
          outline: "none",
          background: disabled ? "#f9fafb" : "#fff",
          color: disabled ? "#9ca3af" : "#111827",
        }}
        autoComplete="off"
      />
      {open && filtered.length > 0 && pos && (
        <ul
          ref={listRef}
          onWheel={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: pos.width,
            zIndex: 9999,
            maxHeight: 220,
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {filtered.map((opt) => (
            <li
              key={opt.value}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(opt);
              }}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#eff6ff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <span>{opt.label}</span>
              {opt.amount != null && (
                <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 8 }}>
                  {opt.amount.toLocaleString("vi-VN")}đ
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
