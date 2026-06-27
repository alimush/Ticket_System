"use client";

import { motion } from "framer-motion";
import { FaTimes, FaClipboardList, FaUserFriends, FaMoneyBillWave } from "react-icons/fa";
import Select from "react-select";
import { selectStyles } from "./TicketBadges";

const PRIORITIES = [
  { value: "low", label: "Low", color: "border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100" },
  { value: "medium", label: "Medium", color: "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100" },
  { value: "high", label: "High", color: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100" },
];

function Section({ icon, title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-slate-200">
        <span className="text-slate-500">{icon}</span>
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-medium text-slate-600 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

const inputClass =
  "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition";

export default function CreateTicketModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  title,
  setTitle,
  description,
  setDescription,
  assignedTo,
  setAssignedTo,
  company,
  setCompany,
  priority,
  setPriority,
  dueDate,
  setDueDate,
  rate,
  setRate,
  currency,
  setCurrency,
  users,
  companies,
  isBayan,
}) {
  if (!isOpen) return null;

  const userOptions = users.map((u) => ({
    value: u.username,
    label: u.username,
  }));

  const companyOptions = companies.map((c) =>
    typeof c === "string"
      ? { value: c, label: c }
      : { value: c.name || c.companyName, label: c.name || c.companyName }
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900">
          <div>
            <h2 className="text-lg font-semibold text-white">Create New Ticket</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill in the details below</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form id="create-ticket-form" onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <Section icon={<FaClipboardList />} title="Basic Info">
            <div>
              <FieldLabel required>Title</FieldLabel>
              <input
                type="text"
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter ticket title..."
                required
              />
            </div>
            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea
                className={`${inputClass} min-h-[88px] resize-y`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the task..."
                rows={3}
              />
            </div>
          </Section>

          <Section icon={<FaUserFriends />} title="Assignment">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Assigned To</FieldLabel>
                <Select
                  options={userOptions}
                  value={
                    assignedTo
                      ? { value: assignedTo, label: assignedTo }
                      : null
                  }
                  onChange={(opt) => setAssignedTo(opt ? opt.value : "")}
                  placeholder="Select user..."
                  isClearable
                  styles={selectStyles}
                  menuPortalTarget={
                    typeof window !== "undefined" ? document.body : null
                  }
                />
              </div>
              <div>
                <FieldLabel>Company</FieldLabel>
                <Select
                  options={companyOptions}
                  value={
                    company ? { value: company, label: company } : null
                  }
                  onChange={(opt) => setCompany(opt ? opt.value : "")}
                  placeholder="Select company..."
                  isClearable
                  styles={selectStyles}
                  menuPortalTarget={
                    typeof window !== "undefined" ? document.body : null
                  }
                />
              </div>
            </div>

            <div>
              <FieldLabel>Priority</FieldLabel>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border-2 transition ${
                      priority === p.value
                        ? `${p.color} ring-2 ring-offset-1 ring-slate-400`
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Due Date</FieldLabel>
              <input
                type="date"
                className={inputClass}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </Section>

          <Section icon={<FaMoneyBillWave />} title="Payment">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Rate</FieldLabel>
                <input
                  type="text"
                  className={`${inputClass} ${
                    isBayan ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""
                  }`}
                  value={isBayan ? "*****" : rate}
                  onChange={(e) => {
                    if (isBayan) return;
                    const raw = e.target.value.replace(/,/g, "");
                    if (raw === "") {
                      setRate("");
                      return;
                    }
                    if (raw === "-") {
                      setRate("-");
                      return;
                    }
                    if (isNaN(raw)) return;
                    setRate(Number(raw).toLocaleString());
                  }}
                  placeholder={isBayan ? "No access" : "Enter amount..."}
                  disabled={isBayan}
                  readOnly={isBayan}
                />
              </div>
              <div>
                <FieldLabel>Currency</FieldLabel>
                <select
                  className={`${inputClass} ${
                    isBayan ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""
                  }`}
                  value={currency}
                  onChange={(e) => {
                    if (!isBayan) setCurrency(e.target.value);
                  }}
                  disabled={isBayan}
                >
                  <option value="IQD">IQD</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
          </Section>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-ticket-form"
            disabled={loading}
            className={`px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition ${
              loading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {loading ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
