"use client";

import { useEffect, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectInputProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function SelectInput({
  options,
  value,
  onChange,
  placeholder = "— Chọn —",
  disabled = false,
}: SelectInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  function calcPos() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 2, left: rect.left, width: rect.width });
  }

  function openDropdown() {
    if (disabled) return;
    calcPos();
    setSearch("");
    setOpen(true);
    setTimeout(() => searchRef.current?.focus(), 0);
  }

  function handleSelect(opt: SelectOption) {
    onChange(opt.value);
    setOpen(false);
  }

  function handleToggle() {
    if (open) setOpen(false);
    else openDropdown();
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Reposition on scroll; close only if trigger scrolled off-screen
  useEffect(() => {
    if (!open) return;
    function onScroll() {
      if (!triggerRef.current) {
        setOpen(false);
        return;
      }
      const rect = triggerRef.current.getBoundingClientRect();
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
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={handleToggle}
        style={{
          width: "100%",
          padding: "7px 10px",
          border: `1px solid ${open ? "#3b82f6" : "#d1d5db"}`,
          borderRadius: 6,
          fontSize: 13,
          boxSizing: "border-box",
          cursor: disabled ? "default" : "pointer",
          background: disabled ? "#f9fafb" : "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          userSelect: "none",
          outline: open ? "2px solid #bfdbfe" : "none",
          outlineOffset: -1,
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: value ? "#111827" : "#9ca3af",
            flex: 1,
            minWidth: 0,
          }}
        >
          {selectedLabel || placeholder}
        </span>
        <span
          style={{
            fontSize: 9,
            color: "#6b7280",
            marginLeft: 6,
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        >
          ▼
        </span>
      </div>

      {/* Dropdown */}
      {open && pos && (
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: pos.width,
            zIndex: 9999,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}
        >
          {/* Search */}
          <div style={{ padding: "6px 8px", borderBottom: "1px solid #f1f5f9" }}>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
              placeholder="Tìm kiếm..."
              style={{
                width: "100%",
                padding: "5px 8px",
                border: "1px solid #e2e8f0",
                borderRadius: 4,
                fontSize: 12,
                boxSizing: "border-box",
                outline: "none",
              }}
              autoComplete="off"
            />
          </div>

          {/* Options */}
          <ul
            onWheel={(e) => e.stopPropagation()}
            style={{
              maxHeight: 200,
              overflowY: "auto",
              overflowX: "auto",
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            {filtered.length === 0 && (
              <li
                style={{
                  padding: "10px 12px",
                  fontSize: 12,
                  color: "#94a3b8",
                  textAlign: "center",
                }}
              >
                Không tìm thấy
              </li>
            )}
            {filtered.map((opt) => {
              const selected = opt.value === value;
              return (
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
                    background: selected ? "#eff6ff" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#eff6ff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = selected
                      ? "#eff6ff"
                      : "transparent";
                  }}
                >
                  <span style={{ width: 14, flexShrink: 0, color: "#2563eb", fontSize: 11 }}>
                    {selected ? "✓" : ""}
                  </span>
                  <span>{opt.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
