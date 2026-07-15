"use client";

import { useEffect, useRef, useState, Fragment } from "react";
import { createPortal } from "react-dom";
import type { BulkDeleteResult, PaginatedResponse, TripStatus, TripPlanCostItem } from "@tms/shared";
import { BulkActionBar, ConfirmDialog, SelectionCheckbox, useRowSelection } from "@tms/ui";
import { useToast } from "@/lib/toast-context";
import { formatDate } from "@/lib/date-utils";
import { Combobox, type ComboboxOption } from "@/components/Combobox";
import { SelectInput } from "@/components/SelectInput";
import { ImportExportModal } from "@/components/import-export/import-export-modal";
import { UploadSection } from "@/components/import-export/upload-section";
import { DownloadButton } from "@/components/import-export/download-button";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface NamedOption {
  id: string;
  code: string;
  name: string;
}
interface ServiceTypeOption {
  id: string;
  code: string;
  description: string;
}
interface ContainerSizeOption {
  id: string;
  code: string;
  name: string;
}

interface TripPlanRow {
  id: string;
  tripDate: string;
  tripNumber: number | null;
  serviceType: { id: string; code: string; description: string } | null;
  containerSize: { id: string; code: string; name: string } | null;
  status: TripStatus;
  vehiclePlate: string | null;
  customer: { id: string; name: string } | null;
  carrier: { id: string; name: string } | null;
  outboundContainerNumber: string | null;
  inboundContainerNumber: string | null;
  pickupLocationName: string | null;
  loadUnloadLocationName: string | null;
  dropoffLocationName: string | null;
  documentSentDate: string | null;
  description: string | null;
  notes: string | null;
  costs: TripPlanCostItem[];
  // Fixed cost slots
  phiNangName: string | null;
  phiNangAmount: number | null;
  shdNang: string | null;
  phiHaName: string | null;
  phiHaAmount: number | null;
  shdHa: string | null;
  phiVeSinhName: string | null;
  phiVeSinhAmount: number | null;
  shdVeSinh: string | null;
  phiCuocName: string | null;
  phiCuocAmount: number | null;
  veCongName: string | null;
  veCongAmount: number | null;
  shdVeCong: string | null;
  chiPhiKhacName: string | null;
  chiPhiKhacAmount: number | null;
  chiPhiTraiTuyenName: string | null;
  chiPhiTraiTuyenAmount: number | null;
  cauDuongName: string | null;
  cauDuongAmount: number | null;
  // Amount-only revenue/cost fields
  luongAmount: number | null;
  cuocAmount: number | null;
  doanhThuAmount: number | null;
  phuThuAmount: number | null;
  chiPhiAmount: number | null;
  tienDauAmount: number | null;
  neoXeAmount: number | null;
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  status: TripStatus | "";
  search: string;
  page: number;
}

const DEFAULT_FILTERS: FilterState = {
  dateFrom: "",
  dateTo: "",
  status: "",
  search: "",
  page: 1,
};

const STATUS_LABELS: Record<TripStatus, string> = {
  PLANNED: "Kế hoạch",
  DISPATCHED: "Đã điều xe",
  IN_TRANSIT: "Đang vận chuyển",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Hủy",
};
const STATUS_COLORS: Record<TripStatus, string> = {
  PLANNED: "#6366f1",
  DISPATCHED: "#f59e0b",
  IN_TRANSIT: "#3b82f6",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
};
const ALL_STATUSES: TripStatus[] = [
  "PLANNED",
  "DISPATCHED",
  "IN_TRANSIT",
  "COMPLETED",
  "CANCELLED",
];

const COST_COLUMNS: Array<{
  label: string;
  amountKey: keyof TripPlanRow;
  nameKey: keyof TripPlanRow;
  shdLabel?: string;
  shdKey?: keyof TripPlanRow;
}> = [
  {
    label: "PHÍ NÂNG",
    amountKey: "phiNangAmount",
    nameKey: "phiNangName",
    shdLabel: "SHĐ NÂNG",
    shdKey: "shdNang",
  },
  {
    label: "PHÍ HẠ",
    amountKey: "phiHaAmount",
    nameKey: "phiHaName",
    shdLabel: "SHĐ HẠ",
    shdKey: "shdHa",
  },
  {
    label: "PHÍ VỆ SINH",
    amountKey: "phiVeSinhAmount",
    nameKey: "phiVeSinhName",
    shdLabel: "SHĐ",
    shdKey: "shdVeSinh",
  },
  { label: "PHÍ CƯỢC", amountKey: "phiCuocAmount", nameKey: "phiCuocName" },
  {
    label: "VÉ CỔNG",
    amountKey: "veCongAmount",
    nameKey: "veCongName",
    shdLabel: "SHĐ",
    shdKey: "shdVeCong",
  },
  { label: "CHI PHÍ KHÁC/ PHÍ ĐỨT TEM", amountKey: "chiPhiKhacAmount", nameKey: "chiPhiKhacName" },
  {
    label: "CHI PHÍ TRÁI TUYẾN/ CHỈ ĐỊNH/ BP CAM",
    amountKey: "chiPhiTraiTuyenAmount",
    nameKey: "chiPhiTraiTuyenName",
  },
  { label: "CẦU ĐƯỜNG", amountKey: "cauDuongAmount", nameKey: "cauDuongName" },
];

// Amount-only revenue/cost columns — no name/SHĐ, appended after CẦU ĐƯỜNG
const EXTRA_COST_COLUMNS: Array<{ label: string; amountKey: keyof TripPlanRow }> = [
  { label: "LƯƠNG", amountKey: "luongAmount" },
  { label: "CƯỚC", amountKey: "cuocAmount" },
  { label: "DOANH THU", amountKey: "doanhThuAmount" },
  { label: "PHỤ THU", amountKey: "phuThuAmount" },
  { label: "CHI PHÍ", amountKey: "chiPhiAmount" },
  { label: "TIỀN DẦU", amountKey: "tienDauAmount" },
  { label: "NEO XE", amountKey: "neoXeAmount" },
];

const FIXED_SLOT_DEFAULTS = [
  { key: "phiNang", defaultName: "PHÍ NÂNG", hasShd: true },
  { key: "phiHa", defaultName: "PHÍ HẠ", hasShd: true },
  { key: "phiVeSinh", defaultName: "PHÍ VỆ SINH", hasShd: true },
  { key: "phiCuoc", defaultName: "PHÍ CƯỢC", hasShd: false },
  { key: "veCong", defaultName: "VÉ CỔNG", hasShd: true },
  { key: "chiPhiKhac", defaultName: "CHI PHÍ KHÁC/ PHÍ ĐỨT TEM", hasShd: false },
  { key: "chiPhiTraiTuyen", defaultName: "CHI PHÍ TRÁI TUYẾN/ CHỈ ĐỊNH/ BP CAM", hasShd: false },
  { key: "cauDuong", defaultName: "CẦU ĐƯỜNG", hasShd: false },
] as const;

// Amount-only revenue/cost fields — no name/SHĐ input, key + "Amount" = TripPlan field name
const EXTRA_COST_DEFAULTS = [
  { key: "luong", label: "LƯƠNG" },
  { key: "cuoc", label: "CƯỚC" },
  { key: "doanhThu", label: "DOANH THU" },
  { key: "phuThu", label: "PHỤ THU" },
  { key: "chiPhi", label: "CHI PHÍ" },
  { key: "tienDau", label: "TIỀN DẦU" },
  { key: "neoXe", label: "NEO XE" },
] as const;
const EXTRA_COST_BG = "#f1f5f9";

function fmt(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === "") return "";
  const num = typeof n === "number" ? n : Number(n);
  if (isNaN(num)) return "";
  return num.toLocaleString("vi-VN");
}

function fmtInput(raw: string): string {
  if (!raw) return "";
  const n = Number(raw);
  if (isNaN(n)) return raw;
  return n.toLocaleString("vi-VN");
}

function stripNonDigits(v: string): string {
  return v.replace(/\D/g, "");
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 50,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 40,
        overflowY: "auto",
      }}
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 28,
          width: wide ? "min(95vw, 980px)" : 520,
          maxWidth: wide ? "unset" : "95vw",
          marginBottom: 40,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "#64748b",
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── 3-dot action menu ────────────────────────────────────────────────────────

function ActionMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = pos !== null;

  useEffect(() => {
    setMounted(true);
  }, []);

  function openMenu() {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
  }

  function closeMenu() {
    setPos(null);
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        closeMenu();
      }
    }
    function onScroll() {
      closeMenu();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const menu = (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: pos?.top,
        right: pos?.right,
        zIndex: 9999,
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
        overflow: "hidden",
        minWidth: 140,
        padding: 6,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          onEdit();
          closeMenu();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "9px 14px",
          textAlign: "left",
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          color: "#2563eb",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#dbeafe";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#eff6ff";
        }}
      >
        ✏️ Sửa
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          onDelete();
          closeMenu();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "9px 14px",
          textAlign: "left",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          color: "#dc2626",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#fee2e2";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#fef2f2";
        }}
      >
        🗑 Xóa
      </button>
    </div>
  );

  return (
    <>
      <button
        ref={btnRef}
        onClick={open ? closeMenu : openMenu}
        style={{
          padding: "5px 22px",
          background: open ? "#c7d2fe" : "#e0e7ff",
          border: `1px solid ${open ? "#818cf8" : "#a5b4fc"}`,
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 18,
          fontWeight: 700,
          color: open ? "#3730a3" : "#4f46e5",
          lineHeight: 1,
          transition: "background 0.1s, color 0.1s",
        }}
        title="Thao tác"
      >
        ⋮
      </button>
      {mounted && open && createPortal(menu, document.body)}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 14, width: "100%" }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#374151",
          display: "block",
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 13,
  boxSizing: "border-box",
};
const inputLocked: React.CSSProperties = {
  ...inputStyle,
  background: "#f0fdf4",
  border: "1px solid #86efac",
  color: "#166534",
};
const btnPrimary: React.CSSProperties = {
  padding: "8px 18px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
const btnSecondary: React.CSSProperties = {
  padding: "8px 18px",
  background: "#f1f5f9",
  color: "#374151",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};
const colHeaderStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#6366f1",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 12,
  paddingBottom: 4,
  borderBottom: "1px solid #e0e7ff",
};
const costLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  display: "block",
  marginBottom: 4,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

// Section background palette — 100-level tones for visible distinction
const SECTION_BG = {
  trip:         "#dbeafe", // blue-100
  container:    "#fef9c3", // yellow-100
  location:     "#dcfce7", // green-100
  supplemental: "#f1f5f9", // slate-100
};

// Per-slot backgrounds for the 8 fixed cost slots (same order as FIXED_SLOT_DEFAULTS)
const SLOT_COLORS = [
  "#e0e7ff", // PHÍ NÂNG     – indigo-100
  "#e0f2fe", // PHÍ HẠ       – sky-100
  "#cffafe", // PHÍ VỆ SINH  – cyan-100
  "#ccfbf1", // PHÍ CƯỢC     – teal-100
  "#ecfccb", // VÉ CỔNG      – lime-100
  "#fef3c7", // CHÍ PHÍ KHÁC – amber-100
  "#ffedd5", // TRÁI TUYẾN   – orange-100
  "#fae8ff", // CẦU ĐƯỜNG    – fuchsia-100
];

const OTHER_COST_BG = "#ffe4e6"; // rose-100

// ─── Fixed cost slot state helpers ───────────────────────────────────────────

interface FixedSlotState {
  name: string;
  amount: string;
  amountLocked: boolean;
  shd: string;
}
type FixedSlotsState = Record<string, FixedSlotState>;

function emptySlot(): FixedSlotState {
  return { name: "", amount: "", amountLocked: false, shd: "" };
}

function initSlotsFromTrip(trip: TripPlanRow): FixedSlotsState {
  return {
    phiNang: {
      name: trip.phiNangName ?? "",
      amount: trip.phiNangAmount != null ? String(trip.phiNangAmount) : "",
      amountLocked: false,
      shd: trip.shdNang ?? "",
    },
    phiHa: {
      name: trip.phiHaName ?? "",
      amount: trip.phiHaAmount != null ? String(trip.phiHaAmount) : "",
      amountLocked: false,
      shd: trip.shdHa ?? "",
    },
    phiVeSinh: {
      name: trip.phiVeSinhName ?? "",
      amount: trip.phiVeSinhAmount != null ? String(trip.phiVeSinhAmount) : "",
      amountLocked: false,
      shd: trip.shdVeSinh ?? "",
    },
    phiCuoc: {
      name: trip.phiCuocName ?? "",
      amount: trip.phiCuocAmount != null ? String(trip.phiCuocAmount) : "",
      amountLocked: false,
      shd: "",
    },
    veCong: {
      name: trip.veCongName ?? "",
      amount: trip.veCongAmount != null ? String(trip.veCongAmount) : "",
      amountLocked: false,
      shd: trip.shdVeCong ?? "",
    },
    chiPhiKhac: {
      name: trip.chiPhiKhacName ?? "",
      amount: trip.chiPhiKhacAmount != null ? String(trip.chiPhiKhacAmount) : "",
      amountLocked: false,
      shd: "",
    },
    chiPhiTraiTuyen: {
      name: trip.chiPhiTraiTuyenName ?? "",
      amount: trip.chiPhiTraiTuyenAmount != null ? String(trip.chiPhiTraiTuyenAmount) : "",
      amountLocked: false,
      shd: "",
    },
    cauDuong: {
      name: trip.cauDuongName ?? "",
      amount: trip.cauDuongAmount != null ? String(trip.cauDuongAmount) : "",
      amountLocked: false,
      shd: "",
    },
  };
}

function defaultSlots(): FixedSlotsState {
  const result: FixedSlotsState = {};
  for (const _s of FIXED_SLOT_DEFAULTS) result[_s.key] = emptySlot();
  return result;
}

function slotsToPayload(slots: FixedSlotsState, isEdit = false) {
  const empty = isEdit ? null : undefined;
  const toNum = (s: string) => {
    const n = Number(s);
    return s && !isNaN(n) && n > 0 ? n : empty;
  };
  const toStr = (s: string) => s.trim() || empty;
  return {
    phiNangName: toStr(slots.phiNang.name),
    phiNangAmount: toNum(slots.phiNang.amount),
    shdNang: toStr(slots.phiNang.shd),
    phiHaName: toStr(slots.phiHa.name),
    phiHaAmount: toNum(slots.phiHa.amount),
    shdHa: toStr(slots.phiHa.shd),
    phiVeSinhName: toStr(slots.phiVeSinh.name),
    phiVeSinhAmount: toNum(slots.phiVeSinh.amount),
    shdVeSinh: toStr(slots.phiVeSinh.shd),
    phiCuocName: toStr(slots.phiCuoc.name),
    phiCuocAmount: toNum(slots.phiCuoc.amount),
    veCongName: toStr(slots.veCong.name),
    veCongAmount: toNum(slots.veCong.amount),
    shdVeCong: toStr(slots.veCong.shd),
    chiPhiKhacName: toStr(slots.chiPhiKhac.name),
    chiPhiKhacAmount: toNum(slots.chiPhiKhac.amount),
    chiPhiTraiTuyenName: toStr(slots.chiPhiTraiTuyen.name),
    chiPhiTraiTuyenAmount: toNum(slots.chiPhiTraiTuyen.amount),
    cauDuongName: toStr(slots.cauDuong.name),
    cauDuongAmount: toNum(slots.cauDuong.amount),
  };
}

// ─── Extra costs (amount-only) state helpers ─────────────────────────────────

type ExtraCostsState = Record<string, string>;

function emptyExtraCosts(): ExtraCostsState {
  const result: ExtraCostsState = {};
  for (const d of EXTRA_COST_DEFAULTS) result[d.key] = "";
  return result;
}

function initExtraCostsFromTrip(trip: TripPlanRow): ExtraCostsState {
  const result: ExtraCostsState = {};
  for (const d of EXTRA_COST_DEFAULTS) {
    const amountKey = `${d.key}Amount` as keyof TripPlanRow;
    const val = trip[amountKey] as number | null;
    result[d.key] = val != null ? String(val) : "";
  }
  return result;
}

function extraCostsToPayload(extraCosts: ExtraCostsState, isEdit = false) {
  const empty = isEdit ? null : undefined;
  const toNum = (s: string) => {
    const n = Number(s);
    return s && !isNaN(n) && n > 0 ? n : empty;
  };
  const result: Record<string, number | null | undefined> = {};
  for (const d of EXTRA_COST_DEFAULTS) {
    result[`${d.key}Amount`] = toNum(extraCosts[d.key] ?? "");
  }
  return result;
}

// ─── Other cost row ───────────────────────────────────────────────────────────

interface OtherCostRow {
  key: string;
  name: string;
  amount: string;
  amountLocked: boolean;
  invoiceNumber: string;
}

function newOtherCostRow(): OtherCostRow {
  return {
    key: String(Date.now() + Math.random()),
    name: "",
    amount: "",
    amountLocked: false,
    invoiceNumber: "",
  };
}

// ─── CostSlotInput ────────────────────────────────────────────────────────────

function CostSlotInput({
  slotKey,
  label,
  slot,
  onChange,
  costOptions,
  hasShd,
  bgColor,
}: {
  slotKey: string;
  label: string;
  slot: FixedSlotState;
  onChange: (key: string, patch: Partial<FixedSlotState>) => void;
  costOptions: ComboboxOption[];
  hasShd: boolean;
  bgColor?: string;
}) {
  return (
    <div
      style={{
        padding: "8px 12px",
        borderBottom: "1px solid #e2e8f0",
        borderRight: "1px solid #e2e8f0",
        background: bgColor,
      }}
    >
      <span style={costLabelStyle}>{label}</span>
      <Combobox
        options={costOptions}
        value={slot.name}
        onChange={(v) =>
          onChange(slotKey, {
            name: v,
            amount: slot.amountLocked ? "" : slot.amount,
            amountLocked: false,
          })
        }
        onAmountAutofill={(amt) => {
          if (amt != null) {
            onChange(slotKey, { amount: String(amt), amountLocked: true });
          } else {
            onChange(slotKey, { amount: "", amountLocked: false });
          }
        }}
        placeholder="Chọn hoặc nhập tên chi phí..."
      />
      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
        <input
          type="text"
          value={fmtInput(slot.amount)}
          onChange={(e) =>
            !slot.amountLocked && onChange(slotKey, { amount: stripNonDigits(e.target.value) })
          }
          style={slot.amountLocked ? { ...inputLocked, flex: 1 } : { ...inputStyle, flex: 1 }}
          readOnly={slot.amountLocked}
          placeholder="Số tiền"
        />
        {hasShd && (
          <input
            type="text"
            value={slot.shd}
            onChange={(e) => onChange(slotKey, { shd: e.target.value })}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="SHĐ"
          />
        )}
      </div>
    </div>
  );
}

// ─── Extra cost input (amount-only, no name/SHĐ) ─────────────────────────────

function ExtraCostInput({
  label,
  value,
  onChange,
  bgColor,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  bgColor?: string;
}) {
  return (
    <div
      style={{
        padding: "8px 12px",
        borderBottom: "1px solid #e2e8f0",
        borderRight: "1px solid #e2e8f0",
        background: bgColor,
      }}
    >
      <span style={costLabelStyle}>{label}</span>
      <input
        type="text"
        value={fmtInput(value)}
        onChange={(e) => onChange(stripNonDigits(e.target.value))}
        style={{ ...inputStyle, width: "100%", marginTop: 4 }}
        placeholder="Số tiền"
      />
    </div>
  );
}

// ─── Shared form body ─────────────────────────────────────────────────────────

function TripFormBody({
  mode,
  // Core fields
  tripDate,
  setTripDate,
  serviceTypeId,
  setServiceTypeId,
  vehiclePlate,
  setVehiclePlate,
  customerId,
  setCustomerId,
  carrierId,
  setCarrierId,
  containerSizeId,
  setContainerSizeId,
  outboundContainerNumber,
  setOutboundContainerNumber,
  inboundContainerNumber,
  setInboundContainerNumber,
  pickupLocationName,
  setPickupLocationName,
  loadUnloadLocationName,
  setLoadUnloadLocationName,
  dropoffLocationName,
  setDropoffLocationName,
  documentSentDate,
  setDocumentSentDate,
  description,
  setDescription,
  notes,
  setNotes,
  // Status (edit only)
  status,
  setStatus,
  // Fixed cost slots
  slots,
  setSlot,
  // Amount-only extra costs
  extraCosts,
  setExtraCost,
  // Other costs
  otherCosts,
  setOtherCosts,
  // Reference data
  customers,
  carriers,
  serviceTypes,
  containerSizes,
  locationOptions,
  costTemplateOptions,
  // Submit
  onSubmit,
  onClose,
  loading,
  error,
}: {
  mode: "create" | "edit";
  tripDate: string;
  setTripDate: (v: string) => void;
  serviceTypeId: string;
  setServiceTypeId: (v: string) => void;
  vehiclePlate: string;
  setVehiclePlate: (v: string) => void;
  customerId: string;
  setCustomerId: (v: string) => void;
  carrierId: string;
  setCarrierId: (v: string) => void;
  containerSizeId: string;
  setContainerSizeId: (v: string) => void;
  outboundContainerNumber: string;
  setOutboundContainerNumber: (v: string) => void;
  inboundContainerNumber: string;
  setInboundContainerNumber: (v: string) => void;
  pickupLocationName: string;
  setPickupLocationName: (v: string) => void;
  loadUnloadLocationName: string;
  setLoadUnloadLocationName: (v: string) => void;
  dropoffLocationName: string;
  setDropoffLocationName: (v: string) => void;
  documentSentDate: string;
  setDocumentSentDate: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  status?: TripStatus;
  setStatus?: (v: TripStatus) => void;
  slots: FixedSlotsState;
  setSlot: (key: string, patch: Partial<FixedSlotState>) => void;
  extraCosts: ExtraCostsState;
  setExtraCost: (key: string, value: string) => void;
  otherCosts: OtherCostRow[];
  setOtherCosts: (rows: OtherCostRow[]) => void;
  customers: NamedOption[];
  carriers: NamedOption[];
  serviceTypes: ServiceTypeOption[];
  containerSizes: ContainerSizeOption[];
  locationOptions: ComboboxOption[];
  costTemplateOptions: ComboboxOption[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onClose: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <form
      onSubmit={onSubmit}
      onKeyDown={(e) => { const tag = (e.target as HTMLElement).tagName; if (e.key === "Enter" && tag !== "TEXTAREA" && tag !== "BUTTON") e.preventDefault(); }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr",
          alignItems: "start",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          marginBottom: 14,
          overflow: "hidden",
        }}
      >
        {/* Chuyến đi */}
        <div style={{ padding: "14px 16px", borderRight: "1px solid #e2e8f0", background: SECTION_BG.trip }}>
          <div style={colHeaderStyle}>Chuyến đi</div>
          <Field label="Ngày chuyến *">
            <input
              type="date"
              value={tripDate}
              onChange={(e) => setTripDate(e.target.value)}
              style={inputStyle}
              required
            />
          </Field>
          <Field label="Loại dịch vụ *">
            <SelectInput
              value={serviceTypeId}
              onChange={setServiceTypeId}
              options={serviceTypes.map((s) => ({
                value: s.id,
                label: `${s.code} — ${s.description}`,
              }))}
              placeholder="— Chọn loại dịch vụ —"
              required
            />
          </Field>
          {mode === "edit" && status && setStatus && (
            <Field label="Trạng thái">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TripStatus)}
                style={inputStyle}
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Số xe">
            <input
              type="text"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
              style={inputStyle}
              placeholder="Nhập biển số xe..."
            />
          </Field>
          <Field label="Khách hàng *">
            <SelectInput
              value={customerId}
              onChange={setCustomerId}
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="— Chọn khách hàng —"
              required
            />
          </Field>
          <Field label="Đơn vị vận chuyển">
            <SelectInput
              value={carrierId}
              onChange={setCarrierId}
              options={[
                { value: "", label: "— Không chọn —" },
                ...carriers.map((c) => ({ value: c.id, label: c.name })),
              ]}
              placeholder="— Không chọn —"
            />
          </Field>
        </div>
        {/* Container */}
        <div style={{ padding: "14px 16px", borderRight: "1px solid #e2e8f0", background: SECTION_BG.container }}>
          <div style={colHeaderStyle}>Container</div>
          <Field label="Size Cont">
            <SelectInput
              value={containerSizeId}
              onChange={setContainerSizeId}
              options={[
                { value: "", label: "— Không chọn —" },
                ...containerSizes.map((cs) => ({ value: cs.id, label: cs.code })),
              ]}
              placeholder="— Không chọn —"
            />
          </Field>
          <Field label="CONT ĐI">
            <input
              type="text"
              value={outboundContainerNumber}
              onChange={(e) => setOutboundContainerNumber(e.target.value)}
              style={inputStyle}
              placeholder="OOLU8990993"
            />
          </Field>
          <Field label="CONT VỀ">
            <input
              type="text"
              value={inboundContainerNumber}
              onChange={(e) => setInboundContainerNumber(e.target.value)}
              style={inputStyle}
              placeholder="OOLU8990993"
            />
          </Field>
        </div>
        {/* Địa điểm */}
        <div style={{ padding: "14px 16px", background: SECTION_BG.location }}>
          <div style={colHeaderStyle}>Địa điểm</div>
          <Field label="Điểm Lấy (R/H)">
            <Combobox
              options={locationOptions}
              value={pickupLocationName}
              onChange={setPickupLocationName}
              placeholder="Nhập hoặc chọn địa điểm..."
            />
          </Field>
          <Field label="Điểm Đóng/Rút">
            <Combobox
              options={locationOptions}
              value={loadUnloadLocationName}
              onChange={setLoadUnloadLocationName}
              placeholder="Nhập hoặc chọn địa điểm..."
            />
          </Field>
          <Field label="Điểm Hạ (R/H)">
            <Combobox
              options={locationOptions}
              value={dropoffLocationName}
              onChange={setDropoffLocationName}
              placeholder="Nhập hoặc chọn địa điểm..."
            />
          </Field>
        </div>
      </div>

      {/* Fixed cost slots */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          marginBottom: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#6366f1",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            padding: "8px 12px",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8f7ff",
          }}
        >
          Chi phí chuyến
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {FIXED_SLOT_DEFAULTS.map((s, idx) => (
            <CostSlotInput
              key={s.key}
              slotKey={s.key}
              label={s.defaultName}
              slot={slots[s.key]}
              onChange={setSlot}
              costOptions={costTemplateOptions}
              hasShd={s.hasShd}
              bgColor={SLOT_COLORS[idx]}
            />
          ))}
          {EXTRA_COST_DEFAULTS.map((d) => (
            <ExtraCostInput
              key={d.key}
              label={d.label}
              value={extraCosts[d.key] ?? ""}
              onChange={(v) => setExtraCost(d.key, v)}
              bgColor={EXTRA_COST_BG}
            />
          ))}
        </div>

        {/* Other costs - multi row */}
        <div style={{ borderTop: "1px solid #e2e8f0", padding: "8px 12px", background: OTHER_COST_BG }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span style={costLabelStyle}>CHI PHÍ PHÁT SINH KHÁC</span>
            <button
              type="button"
              onClick={() => setOtherCosts([...otherCosts, newOtherCostRow()])}
              style={{
                padding: "3px 10px",
                fontSize: 11,
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              + Thêm chi phí
            </button>
          </div>
          {otherCosts.length === 0 && (
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Chưa có chi phí phát sinh</p>
          )}
          {otherCosts.map((row, idx) => (
            <div
              key={row.key}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto auto",
                gap: 6,
                marginBottom: 6,
                alignItems: "center",
              }}
            >
              <Combobox
                options={costTemplateOptions}
                value={row.name}
                onChange={(v) =>
                  setOtherCosts(
                    otherCosts.map((r, i) =>
                      i === idx
                        ? {
                            ...r,
                            name: v,
                            amount: r.amountLocked ? "" : r.amount,
                            amountLocked: false,
                          }
                        : r,
                    ),
                  )
                }
                onAmountAutofill={(amt) => {
                  if (amt != null) {
                    setOtherCosts(
                      otherCosts.map((r, i) =>
                        i === idx ? { ...r, amount: String(amt), amountLocked: true } : r,
                      ),
                    );
                  } else {
                    setOtherCosts(
                      otherCosts.map((r, i) =>
                        i === idx ? { ...r, amount: "", amountLocked: false } : r,
                      ),
                    );
                  }
                }}
                placeholder="Tên chi phí..."
              />
              <input
                type="text"
                value={fmtInput(row.amount)}
                onChange={(e) =>
                  !row.amountLocked &&
                  setOtherCosts(
                    otherCosts.map((r, i) =>
                      i === idx ? { ...r, amount: stripNonDigits(e.target.value) } : r,
                    ),
                  )
                }
                style={
                  row.amountLocked ? { ...inputLocked, width: 120 } : { ...inputStyle, width: 120 }
                }
                readOnly={row.amountLocked}
                placeholder="Số tiền"
              />
              <input
                type="text"
                value={row.invoiceNumber}
                onChange={(e) =>
                  setOtherCosts(
                    otherCosts.map((r, i) =>
                      i === idx ? { ...r, invoiceNumber: e.target.value } : r,
                    ),
                  )
                }
                style={{ ...inputStyle, width: 90 }}
                placeholder="SHĐ"
              />
              <button
                type="button"
                onClick={() => setOtherCosts(otherCosts.filter((_, i) => i !== idx))}
                style={{
                  padding: "5px 8px",
                  background: "#fef2f2",
                  color: "#ef4444",
                  border: "1px solid #fecaca",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Supplemental row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr 1fr",
          gap: 12,
          marginBottom: 12,
          background: SECTION_BG.supplemental,
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: "12px 16px",
        }}
      >
        <Field label="Ngày gửi CT">
          <input
            type="date"
            value={documentSentDate}
            onChange={(e) => setDocumentSentDate(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Nội dung">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Ghi chú">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={inputStyle}
          />
        </Field>
      </div>

      {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <button type="button" onClick={onClose} style={btnSecondary}>
          Hủy
        </button>
        <button type="submit" disabled={loading} style={btnPrimary}>
          {loading
            ? mode === "create"
              ? "Đang tạo..."
              : "Đang lưu..."
            : mode === "create"
              ? "Tạo chuyến"
              : "Lưu"}
        </button>
      </div>
    </form>
  );
}

// ─── Shared ref data loader ───────────────────────────────────────────────────

function useRefData() {
  const [customers, setCustomers] = useState<NamedOption[]>([]);
  const [carriers, setCarriers] = useState<NamedOption[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeOption[]>([]);
  const [containerSizes, setContainerSizes] = useState<ContainerSizeOption[]>([]);
  const [locationOptions, setLocationOptions] = useState<ComboboxOption[]>([]);
  const [costTemplateOptions, setCostTemplateOptions] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/customers?limit=500").then((r) => r.json()),
      fetch("/api/carriers?limit=500").then((r) => r.json()),
      fetch("/api/service-types?limit=500").then((r) => r.json()),
      fetch("/api/container-sizes?limit=500").then((r) => r.json()),
      fetch("/api/locations?limit=500").then((r) => r.json()),
      fetch("/api/cost-templates?limit=500").then((r) => r.json()),
    ])
      .then(([c, ca, st, cs, locs, ct]) => {
        setCustomers(c.data ?? c);
        setCarriers(ca.data ?? ca);
        setServiceTypes(st.data ?? st);
        setContainerSizes(cs.data ?? cs);
        setLocationOptions(
          ((locs.data ?? locs) as NamedOption[]).map((l) => ({ value: l.id, label: l.name })),
        );
        setCostTemplateOptions(
          ((ct.data ?? ct) as { id: string; name: string; defaultAmount: number | null }[]).map(
            (t) => ({
              value: t.id,
              label: t.name,
              amount: t.defaultAmount,
            }),
          ),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return {
    customers,
    carriers,
    serviceTypes,
    containerSizes,
    locationOptions,
    costTemplateOptions,
    loading,
  };
}

// ─── Create Trip Modal ────────────────────────────────────────────────────────

function CreateTripModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const refs = useRefData();

  const [tripDate, setTripDate] = useState(new Date().toISOString().slice(0, 10));
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [containerSizeId, setContainerSizeId] = useState("");
  const [outboundContainerNumber, setOutboundContainerNumber] = useState("");
  const [inboundContainerNumber, setInboundContainerNumber] = useState("");
  const [pickupLocationName, setPickupLocationName] = useState("");
  const [loadUnloadLocationName, setLoadUnloadLocationName] = useState("");
  const [dropoffLocationName, setDropoffLocationName] = useState("");
  const [documentSentDate, setDocumentSentDate] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<FixedSlotsState>(defaultSlots());
  const [extraCosts, setExtraCosts] = useState<ExtraCostsState>(emptyExtraCosts());
  const [otherCosts, setOtherCosts] = useState<OtherCostRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (refs.customers.length && !customerId) setCustomerId(refs.customers[0].id);
    if (refs.serviceTypes.length && !serviceTypeId) setServiceTypeId(refs.serviceTypes[0].id);
  }, [refs.customers, refs.serviceTypes]);

  function patchSlot(key: string, patch: Partial<FixedSlotState>) {
    setSlots((s) => ({ ...s, [key]: { ...s[key], ...patch } }));
  }

  function patchExtraCost(key: string, value: string) {
    setExtraCosts((s) => ({ ...s, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!customerId || !serviceTypeId) {
      setError("Vui lòng chọn khách hàng và loại dịch vụ");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/trip-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripDate,
          serviceTypeId,
          vehiclePlate: vehiclePlate || undefined,
          customerId,
          carrierId: carrierId || undefined,
          containerSizeId: containerSizeId || undefined,
          outboundContainerNumber: outboundContainerNumber || undefined,
          inboundContainerNumber: inboundContainerNumber || undefined,
          pickupLocationName: pickupLocationName || undefined,
          loadUnloadLocationName: loadUnloadLocationName || undefined,
          dropoffLocationName: dropoffLocationName || undefined,
          documentSentDate: documentSentDate || undefined,
          description: description || undefined,
          notes: notes || undefined,
          ...slotsToPayload(slots),
          ...extraCostsToPayload(extraCosts),
          otherCosts: otherCosts
            .filter((r) => r.amount)
            .map((r) => ({
              costName: r.name || undefined,
              amount: Number(r.amount),
              invoiceNumber: r.invoiceNumber || undefined,
            })),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Lỗi không xác định");
      }
      toast.success("Tạo chuyến thành công");
      onDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (refs.loading)
    return (
      <Modal title="Tạo chuyến mới" onClose={onClose}>
        <p style={{ color: "#64748b" }}>Đang tải dữ liệu...</p>
      </Modal>
    );

  return (
    <Modal title="Tạo chuyến mới" onClose={onClose} wide>
      <TripFormBody
        mode="create"
        tripDate={tripDate}
        setTripDate={setTripDate}
        serviceTypeId={serviceTypeId}
        setServiceTypeId={setServiceTypeId}
        vehiclePlate={vehiclePlate}
        setVehiclePlate={setVehiclePlate}
        customerId={customerId}
        setCustomerId={setCustomerId}
        carrierId={carrierId}
        setCarrierId={setCarrierId}
        containerSizeId={containerSizeId}
        setContainerSizeId={setContainerSizeId}
        outboundContainerNumber={outboundContainerNumber}
        setOutboundContainerNumber={setOutboundContainerNumber}
        inboundContainerNumber={inboundContainerNumber}
        setInboundContainerNumber={setInboundContainerNumber}
        pickupLocationName={pickupLocationName}
        setPickupLocationName={setPickupLocationName}
        loadUnloadLocationName={loadUnloadLocationName}
        setLoadUnloadLocationName={setLoadUnloadLocationName}
        dropoffLocationName={dropoffLocationName}
        setDropoffLocationName={setDropoffLocationName}
        documentSentDate={documentSentDate}
        setDocumentSentDate={setDocumentSentDate}
        description={description}
        setDescription={setDescription}
        notes={notes}
        setNotes={setNotes}
        slots={slots}
        setSlot={patchSlot}
        extraCosts={extraCosts}
        setExtraCost={patchExtraCost}
        otherCosts={otherCosts}
        setOtherCosts={setOtherCosts}
        customers={refs.customers}
        carriers={refs.carriers}
        serviceTypes={refs.serviceTypes}
        containerSizes={refs.containerSizes}
        locationOptions={refs.locationOptions}
        costTemplateOptions={refs.costTemplateOptions}
        onSubmit={handleSubmit}
        onClose={onClose}
        loading={loading}
        error={error}
      />
    </Modal>
  );
}

// ─── Edit Trip Modal ──────────────────────────────────────────────────────────

function EditTripModal({
  trip,
  onClose,
  onDone,
}: {
  trip: TripPlanRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const refs = useRefData();

  const [tripDate, setTripDate] = useState(trip.tripDate?.slice(0, 10) ?? "");
  const [serviceTypeId, setServiceTypeId] = useState(trip.serviceType?.id ?? "");
  const [status, setStatus] = useState<TripStatus>(trip.status);
  const [vehiclePlate, setVehiclePlate] = useState(trip.vehiclePlate ?? "");
  const [customerId, setCustomerId] = useState(trip.customer?.id ?? "");
  const [carrierId, setCarrierId] = useState(trip.carrier?.id ?? "");
  const [containerSizeId, setContainerSizeId] = useState(trip.containerSize?.id ?? "");
  const [outboundContainerNumber, setOutboundContainerNumber] = useState(
    trip.outboundContainerNumber ?? "",
  );
  const [inboundContainerNumber, setInboundContainerNumber] = useState(
    trip.inboundContainerNumber ?? "",
  );
  const [pickupLocationName, setPickupLocationName] = useState(trip.pickupLocationName ?? "");
  const [loadUnloadLocationName, setLoadUnloadLocationName] = useState(
    trip.loadUnloadLocationName ?? "",
  );
  const [dropoffLocationName, setDropoffLocationName] = useState(trip.dropoffLocationName ?? "");
  const [documentSentDate, setDocumentSentDate] = useState(
    trip.documentSentDate?.slice(0, 10) ?? "",
  );
  const [description, setDescription] = useState(trip.description ?? "");
  const [notes, setNotes] = useState(trip.notes ?? "");
  const [slots, setSlots] = useState<FixedSlotsState>(() => initSlotsFromTrip(trip));
  const [extraCosts, setExtraCosts] = useState<ExtraCostsState>(() =>
    initExtraCostsFromTrip(trip),
  );
  const [otherCosts, setOtherCosts] = useState<OtherCostRow[]>(() =>
    (trip.costs ?? []).map((c) => ({
      key: c.id,
      name: c.costName ?? "",
      amount: String(c.amount),
      amountLocked: false,
      invoiceNumber: c.invoiceNumber ?? "",
    })),
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function patchSlot(key: string, patch: Partial<FixedSlotState>) {
    setSlots((s) => ({ ...s, [key]: { ...s[key], ...patch } }));
  }

  function patchExtraCost(key: string, value: string) {
    setExtraCosts((s) => ({ ...s, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!customerId || !serviceTypeId) {
      setError("Vui lòng chọn khách hàng và loại dịch vụ");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/trip-plans/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripDate,
          serviceTypeId,
          status,
          vehiclePlate: vehiclePlate || null,
          customerId,
          carrierId: carrierId || null,
          containerSizeId: containerSizeId || null,
          outboundContainerNumber: outboundContainerNumber || null,
          inboundContainerNumber: inboundContainerNumber || null,
          pickupLocationName: pickupLocationName || null,
          loadUnloadLocationName: loadUnloadLocationName || null,
          dropoffLocationName: dropoffLocationName || null,
          documentSentDate: documentSentDate || null,
          description: description || null,
          notes: notes || null,
          ...slotsToPayload(slots, true),
          ...extraCostsToPayload(extraCosts, true),
          otherCosts: otherCosts
            .filter((r) => r.amount)
            .map((r) => ({
              costName: r.name || null,
              amount: Number(r.amount),
              invoiceNumber: r.invoiceNumber || null,
            })),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Lỗi không xác định");
      }
      toast.success("Cập nhật chuyến thành công");
      onDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (refs.loading)
    return (
      <Modal title="Sửa chuyến" onClose={onClose}>
        <p style={{ color: "#64748b" }}>Đang tải dữ liệu...</p>
      </Modal>
    );

  return (
    <Modal title="Sửa chuyến" onClose={onClose} wide>
      <TripFormBody
        mode="edit"
        tripDate={tripDate}
        setTripDate={setTripDate}
        serviceTypeId={serviceTypeId}
        setServiceTypeId={setServiceTypeId}
        vehiclePlate={vehiclePlate}
        setVehiclePlate={setVehiclePlate}
        customerId={customerId}
        setCustomerId={setCustomerId}
        carrierId={carrierId}
        setCarrierId={setCarrierId}
        containerSizeId={containerSizeId}
        setContainerSizeId={setContainerSizeId}
        outboundContainerNumber={outboundContainerNumber}
        setOutboundContainerNumber={setOutboundContainerNumber}
        inboundContainerNumber={inboundContainerNumber}
        setInboundContainerNumber={setInboundContainerNumber}
        pickupLocationName={pickupLocationName}
        setPickupLocationName={setPickupLocationName}
        loadUnloadLocationName={loadUnloadLocationName}
        setLoadUnloadLocationName={setLoadUnloadLocationName}
        dropoffLocationName={dropoffLocationName}
        setDropoffLocationName={setDropoffLocationName}
        documentSentDate={documentSentDate}
        setDocumentSentDate={setDocumentSentDate}
        description={description}
        setDescription={setDescription}
        notes={notes}
        setNotes={setNotes}
        status={status}
        setStatus={setStatus}
        slots={slots}
        setSlot={patchSlot}
        extraCosts={extraCosts}
        setExtraCost={patchExtraCost}
        otherCosts={otherCosts}
        setOtherCosts={setOtherCosts}
        customers={refs.customers}
        carriers={refs.carriers}
        serviceTypes={refs.serviceTypes}
        containerSizes={refs.containerSizes}
        locationOptions={refs.locationOptions}
        costTemplateOptions={refs.costTemplateOptions}
        onSubmit={handleSubmit}
        onClose={onClose}
        loading={loading}
        error={error}
      />
    </Modal>
  );
}

// ─── Pagination helper ────────────────────────────────────────────────────────

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, 5];
  if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
  return [current - 2, current - 1, current, current + 1, current + 2];
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TripPlansPage() {
  const toast = useToast();
  const [trips, setTrips] = useState<TripPlanRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [rawSearch, setRawSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripPlanRow | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");

  const selection = useRowSelection(trips.map((t) => t.id));

  useEffect(() => {
    const timer = setTimeout(() => setFilters((f) => ({ ...f, search: rawSearch, page: 1 })), 400);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  useEffect(() => {
    let cancelled = false;
    async function doFetch() {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ limit: "10", page: String(filters.page) });
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.status) params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);
      try {
        const res = await fetch(`/api/trip-plans?${params}`);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data: PaginatedResponse<TripPlanRow> = await res.json();
        if (!cancelled) {
          setTrips(data.data);
          setTotal(data.meta.total);
          setTotalPages(data.meta.totalPages);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Lỗi không xác định");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    doFetch();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  useEffect(() => {
    selection.clear();
  }, [filters, selection.clear]);

  function setFilterField<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Bạn có chắc muốn xóa chuyến này không?")) return;
    try {
      const res = await fetch(`/api/trip-plans/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Lỗi xóa");
      }
      toast.success("Xóa chuyến thành công");
      setFilters((f) => ({ ...f }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi không xác định");
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selection.selected);
    const res = await fetch("/api/trip-plans/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setShowBulkConfirm(false);
    if (!res.ok) {
      toast.error("Lỗi xoá hàng loạt");
      return;
    }
    const result: BulkDeleteResult = await res.json();
    setFilters((f) => ({ ...f }));
    if (result.skipped.length === 0) {
      toast.success(`Đã xoá ${result.deleted.length} chuyến`);
    } else {
      const reasons = Array.from(new Set(result.skipped.map((s) => s.reason))).join("; ");
      toast.error(
        `Đã xoá ${result.deleted.length}, bỏ qua ${result.skipped.length}: ${reasons}`,
      );
    }
  }

  const selectStyle: React.CSSProperties = {
    fontSize: 13,
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#0f172a",
  };
  const hasActiveFilter =
    filters.dateFrom || filters.dateTo || filters.status || filters.search || rawSearch;
  const startItem = total === 0 ? 0 : (filters.page - 1) * 10 + 1;
  const endItem = Math.min(filters.page * 10, total);

  const thStyle: React.CSSProperties = {
    padding: "8px 10px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #e2e8f0",
  };
  const tdStyle: React.CSSProperties = {
    padding: "8px 10px",
    fontSize: 12,
    whiteSpace: "nowrap",
    borderBottom: "1px solid #f1f5f9",
  };
  const tdMono: React.CSSProperties = { ...tdStyle, fontFamily: "monospace" };

  // Sticky column widths (px) — checkbox + left columns STT→SIZE CONT, right columns Trạng thái + Thao tác
  const LW = [32, 50, 88, 100, 128, 96, 108, 72]; // checkbox, STT, NGÀY, SỐ XE, KH, LOẠI HÌNH, ĐƠN VỊ, SIZE CONT
  const LL = LW.reduce<number[]>((acc, _w, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + LW[i - 1]);
    return acc;
  }, []);
  const LSHADOW = "2px 0 5px rgba(0,0,0,0.07)";
  const RSHADOW = "-2px 0 5px rgba(0,0,0,0.07)";
  const thL = (i: number): React.CSSProperties => ({
    ...thStyle,
    position: "sticky",
    left: LL[i],
    zIndex: 4,
    background: "#f8fafc",
    minWidth: LW[i],
    width: LW[i],
    ...(i === LW.length - 1 ? { boxShadow: LSHADOW } : {}),
  });
  const thR = (right: number): React.CSSProperties => ({
    ...thStyle,
    position: "sticky",
    right,
    zIndex: 4,
    background: "#f8fafc",
    ...(right === 120 ? { boxShadow: RSHADOW } : {}),
  });
  const tdL = (i: number, bg: string): React.CSSProperties => ({
    ...tdStyle,
    position: "sticky",
    left: LL[i],
    zIndex: 2,
    background: bg,
    minWidth: LW[i],
    width: LW[i],
    ...(i === LW.length - 1 ? { boxShadow: LSHADOW } : {}),
  });
  const tdR = (right: number, bg: string): React.CSSProperties => ({
    ...tdStyle,
    position: "sticky",
    right,
    zIndex: 2,
    background: bg,
    ...(right === 120 ? { boxShadow: RSHADOW } : {}),
  });

  return (
    <div>
      {showCreateModal && (
        <CreateTripModal
          onClose={() => setShowCreateModal(false)}
          onDone={() => {
            setShowCreateModal(false);
            setFilters((f) => ({ ...f }));
          }}
        />
      )}
      {editingTrip && (
        <EditTripModal
          trip={editingTrip}
          onClose={() => setEditingTrip(null)}
          onDone={() => {
            setEditingTrip(null);
            setFilters((f) => ({ ...f }));
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Kế hoạch chuyến</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!loading && <span style={{ fontSize: 13, color: "#64748b" }}>{total} chuyến</span>}
          <button
            onClick={() => setShowImportExport(true)}
            style={{
              padding: "8px 16px",
              background: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Nhập / Xuất Excel
          </button>
          <button onClick={() => setShowCreateModal(true)} style={btnPrimary}>
            + Tạo chuyến
          </button>
        </div>
      </div>

      {showImportExport && (
        <ImportExportModal
          title="Nhập / Xuất Excel — Kế hoạch chuyến"
          onClose={() => setShowImportExport(false)}
        >
          <UploadSection
            title="Nhập kế hoạch chuyến"
            endpoint="/api/import/trip-plans"
            onImported={() => setFilters((f) => ({ ...f }))}
            description="Tải lên sheet 'kế hoạch xe' — mỗi lần nhập sẽ tạo thêm bản ghi mới. Khách hàng, hãng xe, địa điểm chưa có sẽ được tự tạo."
          />
          <div style={{ background: "#fff", borderRadius: 10, padding: 24, border: "1px solid #e5e7eb" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Xuất kế hoạch chuyến</h2>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
              Xuất danh sách chuyến ra file Excel với tiêu đề tiếng Việt. Lọc theo ngày (tùy chọn).
            </p>
            <DownloadButton
              label="Tải xuống ke-hoach-xe.xlsx"
              endpoint="/api/export/trip-plans"
              filename="ke-hoach-xe.xlsx"
              emptyResultMessage={
                exportFromDate || exportToDate
                  ? `Không có chuyến nào${exportFromDate ? ` từ ${formatDate(exportFromDate)}` : ""}${exportToDate ? ` đến ${formatDate(exportToDate)}` : ""}.`
                  : "Không có chuyến nào phù hợp."
              }
              buildUrl={() => {
                const params = new URLSearchParams();
                if (exportFromDate) params.set("from", exportFromDate);
                if (exportToDate) params.set("to", exportToDate);
                const qs = params.toString();
                return `/api/export/trip-plans${qs ? `?${qs}` : ""}`;
              }}
              extraInputs={
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={exportFromDate}
                      onChange={(e) => setExportFromDate(e.target.value)}
                      style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={exportToDate}
                      onChange={(e) => setExportToDate(e.target.value)}
                      style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
                    />
                  </div>
                </div>
              }
            />
          </div>
        </ImportExportModal>
      )}

      {/* Filter bar */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          padding: "14px 16px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          marginBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "flex-end",
        }}
      >
        {[
          {
            label: "Từ ngày",
            val: filters.dateFrom,
            set: (v: string) => setFilterField("dateFrom", v),
          },
          {
            label: "Đến ngày",
            val: filters.dateTo,
            set: (v: string) => setFilterField("dateTo", v),
          },
        ].map(({ label, val, set }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              {label}
            </span>
            <input
              type="date"
              value={val}
              onChange={(e) => set(e.target.value)}
              style={{ ...selectStyle, padding: "5px 8px" }}
            />
          </div>
        ))}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}
          >
            Trạng thái
          </span>
          <select
            value={filters.status}
            onChange={(e) => setFilterField("status", e.target.value as TripStatus | "")}
            style={selectStyle}
          >
            <option value="">Tất cả</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 200 }}>
          <span
            style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}
          >
            Tìm kiếm
          </span>
          <input
            type="text"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            placeholder="Tìm xe, container, KH, đơn vị VC, dịch vụ, điểm lấy/hạ, SHĐ, phí..."
            style={{ ...selectStyle, padding: "5px 10px", width: "100%" }}
          />
        </div>
        {hasActiveFilter && (
          <button
            onClick={() => {
              setRawSearch("");
              setFilters(DEFAULT_FILTERS);
            }}
            style={{ ...btnSecondary, padding: "6px 12px", fontSize: 12, alignSelf: "flex-end" }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: "#64748b", fontSize: 14 }}>Đang tải...</p>
      ) : error ? (
        <p
          style={{ color: "#dc2626", background: "#fef2f2", padding: "12px 16px", borderRadius: 8 }}
        >
          {error}
        </p>
      ) : (
        <>
          <BulkActionBar
            selectedCount={selection.selectedCount}
            onDelete={() => setShowBulkConfirm(true)}
            onClear={selection.clear}
          />
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              overflowX: "auto",
            }}
          >
            <table style={{ borderCollapse: "collapse", minWidth: 2400 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {/* Left sticky */}
                  <th style={thL(0)}>
                    <SelectionCheckbox
                      checked={selection.isAllSelected}
                      onChange={selection.toggleAll}
                      ariaLabel="Chọn tất cả kế hoạch chuyến"
                    />
                  </th>
                  <th style={thL(1)}>STT</th>
                  <th style={thL(2)}>NGÀY</th>
                  <th style={thL(3)}>SỐ XE</th>
                  <th style={thL(4)}>KHÁCH HÀNG</th>
                  <th style={thL(5)}>LOẠI HÌNH</th>
                  <th style={thL(6)}>ĐƠN VỊ</th>
                  <th style={thL(7)}>SIZE CONT</th>
                  {/* Scrollable */}
                  <th style={thStyle}>CONT ĐI</th>
                  <th style={thStyle}>CONT VỀ</th>
                  <th style={thStyle}>Điểm Lấy (R/H)</th>
                  <th style={thStyle}>Điểm (Đóng/Rút)</th>
                  <th style={thStyle}>Điểm hạ (R/H)</th>
                  {COST_COLUMNS.map((cc) => (
                    <Fragment key={cc.label}>
                      <th style={{ ...thStyle, minWidth: 100 }}>{cc.label}</th>
                      {cc.shdLabel && <th style={{ ...thStyle, minWidth: 120 }}>{cc.shdLabel}</th>}
                    </Fragment>
                  ))}
                  {EXTRA_COST_COLUMNS.map((ec) => (
                    <th key={ec.label} style={{ ...thStyle, minWidth: 100 }}>
                      {ec.label}
                    </th>
                  ))}
                  <th style={thStyle}>NGÀY GỬI CT</th>
                  <th style={{ ...thStyle, minWidth: 100 }}>CHI PHÍ PHÁT SINH</th>
                  <th style={thStyle}>NỘI DUNG</th>
                  <th style={thStyle}>GHI CHÚ</th>
                  {/* Right sticky */}
                  <th style={thR(44)}>Trạng thái</th>
                  <th style={{ ...thR(0), width: 44, minWidth: 44, textAlign: "center" }}></th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan={38} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  trips.map((trip, i) => {
                    const rowBg = i % 2 === 0 ? "#fff" : "#fafafa";
                    const totalOtherCosts =
                      trip.costs?.reduce((sum, c) => sum + Number(c.amount), 0) ?? 0;
                    return (
                      <tr key={trip.id} style={{ background: rowBg }}>
                        {/* Left sticky */}
                        <td style={tdL(0, rowBg)}>
                          <SelectionCheckbox
                            checked={selection.isSelected(trip.id)}
                            onChange={() => selection.toggle(trip.id)}
                            ariaLabel={`Chọn chuyến ${trip.vehiclePlate ?? trip.id}`}
                          />
                        </td>
                        <td style={tdL(1, rowBg)}>{(filters.page - 1) * 10 + i + 1}</td>
                        <td style={tdL(2, rowBg)}>{formatDate(trip.tripDate)}</td>
                        <td style={{ ...tdL(3, rowBg), fontFamily: "monospace" }}>
                          {trip.vehiclePlate ?? "—"}
                        </td>
                        <td style={tdL(4, rowBg)}>{trip.customer?.name ?? "—"}</td>
                        <td style={tdL(5, rowBg)}>
                          {trip.serviceType ? trip.serviceType.code : "—"}
                        </td>
                        <td style={tdL(6, rowBg)}>{trip.carrier?.name ?? "—"}</td>
                        <td style={{ ...tdL(7, rowBg), fontFamily: "monospace" }}>
                          {trip.containerSize?.code ?? ""}
                        </td>
                        {/* Scrollable */}
                        <td style={tdMono}>{trip.outboundContainerNumber ?? ""}</td>
                        <td style={tdMono}>{trip.inboundContainerNumber ?? ""}</td>
                        <td style={tdStyle}>{trip.pickupLocationName ?? ""}</td>
                        <td style={tdStyle}>{trip.loadUnloadLocationName ?? ""}</td>
                        <td style={tdStyle}>{trip.dropoffLocationName ?? ""}</td>
                        {COST_COLUMNS.map((cc) => (
                          <Fragment key={cc.label}>
                            <td style={tdStyle}>{fmt(trip[cc.amountKey] as number | null)}</td>
                            {cc.shdLabel && (
                              <td style={tdStyle}>{(trip[cc.shdKey!] as string | null) ?? ""}</td>
                            )}
                          </Fragment>
                        ))}
                        {EXTRA_COST_COLUMNS.map((ec) => (
                          <td key={ec.label} style={tdStyle}>
                            {fmt(trip[ec.amountKey] as number | null)}
                          </td>
                        ))}
                        <td style={tdStyle}>{formatDate(trip.documentSentDate)}</td>
                        <td style={tdStyle}>{totalOtherCosts > 0 ? fmt(totalOtherCosts) : ""}</td>
                        <td style={tdStyle}>{trip.description ?? ""}</td>
                        <td style={tdStyle}>{trip.notes ?? ""}</td>
                        {/* Right sticky */}
                        <td style={tdR(44, rowBg)}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 500,
                              background: `${STATUS_COLORS[trip.status]}18`,
                              color: STATUS_COLORS[trip.status],
                            }}
                          >
                            {STATUS_LABELS[trip.status]}
                          </span>
                        </td>
                        <td
                          style={{
                            ...tdR(0, rowBg),
                            textAlign: "center",
                            width: 44,
                            padding: "4px 6px",
                          }}
                        >
                          <ActionMenu
                            onEdit={() => setEditingTrip(trip)}
                            onDelete={() => handleDelete(trip.id)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 16,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 13, color: "#64748b" }}>
                Hiển thị {startItem}–{endItem} / {total} chuyến
              </span>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                  disabled={filters.page === 1}
                  style={{
                    padding: "5px 12px",
                    fontSize: 13,
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    background: filters.page === 1 ? "#f8fafc" : "#fff",
                    color: filters.page === 1 ? "#cbd5e1" : "#374151",
                    cursor: filters.page === 1 ? "default" : "pointer",
                  }}
                >
                  ← Trước
                </button>
                {getPageNumbers(filters.page, totalPages).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilters((f) => ({ ...f, page: p }))}
                    style={{
                      padding: "5px 10px",
                      fontSize: 13,
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      background: p === filters.page ? "#2563eb" : "#fff",
                      color: p === filters.page ? "#fff" : "#374151",
                      fontWeight: p === filters.page ? 700 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                  disabled={filters.page === totalPages}
                  style={{
                    padding: "5px 12px",
                    fontSize: 13,
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    background: filters.page === totalPages ? "#f8fafc" : "#fff",
                    color: filters.page === totalPages ? "#cbd5e1" : "#374151",
                    cursor: filters.page === totalPages ? "default" : "pointer",
                  }}
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showBulkConfirm && (
        <ConfirmDialog
          title="Xác nhận xoá hàng loạt"
          message={`Bạn có chắc muốn xoá vĩnh viễn ${selection.selectedCount} chuyến đã chọn? Hành động này không thể hoàn tác.`}
          danger
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkConfirm(false)}
        />
      )}
    </div>
  );
}
