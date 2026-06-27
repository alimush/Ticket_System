const STATUS_STYLES = {
  open: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  done: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const PRIORITY_STYLES = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-orange-100 text-orange-700 border-orange-200",
  high: "bg-red-100 text-red-700 border-red-200",
};

const PRIORITY_BORDER = {
  low: "border-l-slate-300",
  medium: "border-l-orange-400",
  high: "border-l-red-500",
};

export function StatusBadge({ status }) {
  const label =
    status === "in_progress"
      ? "In Progress"
      : status === "done"
      ? "Done"
      : "Open";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        STATUS_STYLES[status] || STATUS_STYLES.open
      }`}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
        PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium
      }`}
    >
      {priority || "medium"}
    </span>
  );
}

export function PaidBadge({ paid }) {
  const isPaid = paid === "yes";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        isPaid
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-100 text-slate-500 border-slate-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isPaid ? "bg-emerald-500" : "bg-slate-400"}`}
      />
      {isPaid ? "Paid" : "Unpaid"}
    </span>
  );
}

export function getPriorityBorder(priority) {
  return PRIORITY_BORDER[priority] || PRIORITY_BORDER.medium;
}

export const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 10,
    borderColor: state.isFocused ? "#94a3b8" : "#e2e8f0",
    backgroundColor: "#f8fafc",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(148,163,184,0.3)" : "none",
    "&:hover": { borderColor: "#94a3b8" },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  menuList: (base) => ({ ...base, maxHeight: 160 }),
};
