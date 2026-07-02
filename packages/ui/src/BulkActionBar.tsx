interface BulkActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onClear: () => void;
  deleteLabel?: string;
}

export function BulkActionBar({
  selectedCount,
  onDelete,
  onClear,
  deleteLabel,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 14px",
        marginBottom: 12,
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: 8,
      }}
    >
      <span style={{ fontSize: 14, color: "#1e40af", fontWeight: 500 }}>
        Đã chọn {selectedCount} mục
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onClear}
          style={{
            padding: "6px 14px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            background: "#fff",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Bỏ chọn
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: "6px 14px",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {deleteLabel ?? `Xoá đã chọn (${selectedCount})`}
        </button>
      </div>
    </div>
  );
}
