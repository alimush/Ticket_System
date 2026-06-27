"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
const Select = dynamic(() => import("react-select"), { ssr: false });
import * as XLSX from "xlsx";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { AiOutlineDelete } from "react-icons/ai";
import { FaFileExcel, FaTimes, FaEye, FaCheck, FaMoneyBillWave } from "react-icons/fa";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  StatusBadge,
  PriorityBadge,
  PaidBadge,
  selectStyles,
} from "@/components/tickets/TicketBadges";

export default function ReportPage() {
  const [tickets, setTickets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  const [filterUser, setFilterUser] = useState(null);
  const [filterCompany, setFilterCompany] = useState(null);
  const [filterPaid, setFilterPaid] = useState(null);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [currentUser, setCurrentUser] = useState(null);
  const [userOptions, setUserOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const isBayan =
  (currentUser?.username || currentUser?.name || "").toLowerCase() === "bayan";

  // =========================
  // ✅ Popup Edit State
  // =========================
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    assignedTo: null, // {value,label}
    createdBy: "",
    company: null, // {value,label}
    priority: "",
    dueDate: "",
    status: "open",
    paid: "no",
    rate: "",
    currency: "IQD",
  });

  // =========================
  // Helpers
  // =========================
  const canEditTicket = (ticket) => {
    if (!currentUser || !ticket) return false;
    if (isAdmin(currentUser)) return true;
    const userName = currentUser?.name || currentUser?.username || "";
    return ticket.assignedTo === userName;
  };

  // 🟢 fetch tickets
  const fetchTickets = async (user) => {
    try {
      setLoading(true);
  
      const [ticketsRes, companiesRes] = await Promise.all([
        fetch("/api/tickets"),
        fetch("/api/companies"),
      ]);
  
      const ticketsData = await ticketsRes.json();
      const companiesData = await companiesRes.json();
  
      if (Array.isArray(ticketsData)) {
        if (!isAdmin(user)) {
          const userName = (user?.name || user?.username || "").toLowerCase();
        
          const userTickets = ticketsData.filter((t) => {
            const assignedTo = (t.assignedTo || "").toLowerCase();
            const createdBy = (t.createdBy || "").toLowerCase();
        
            if (userName === "bayan") {
              return assignedTo === userName || createdBy === userName;
            }
        
            return assignedTo === userName;
          });
        
          setTickets(userTickets);
          setFiltered(userTickets);
        } else {
          setTickets(ticketsData);
          setFiltered(ticketsData);
        }
  
        const uniqueUsers = [...new Set(ticketsData.map((t) => t.assignedTo).filter(Boolean))];
        setUserOptions(uniqueUsers.map((u) => ({ value: u, label: u })));
      }
  
      // ✅ الشركات تجي من جدول الشركات نفسه
      if (Array.isArray(companiesData)) {
        setCompanyOptions(
          companiesData.map((c) => ({
            value: c.name,
            label: c.name,
          }))
        );
      }
    } catch (err) {
      console.error("❌ Error fetching tickets/companies:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (typeof window === "undefined") return;
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    if (currentUser) fetchTickets(currentUser);
  }, [currentUser]);

  // 🟢 filter
  useEffect(() => {
    let filteredData = [...tickets];

    if (filterUser) filteredData = filteredData.filter((t) => t.assignedTo === filterUser.value);
    if (filterCompany) filteredData = filteredData.filter((t) => t.company === filterCompany.value);
    if (filterPaid) filteredData = filteredData.filter((t) => t.paid === filterPaid.value);

    // ✅ تاريخ مضبوط
    if (filterDateFrom) {
      filteredData = filteredData.filter((t) => {
        if (!t.dueDate) return false;
        const d = String(t.dueDate).slice(0, 10);
        return d >= filterDateFrom;
      });
    }

    if (filterStatus) filteredData = filteredData.filter((t) => t.status === filterStatus.value);

    if (filterDateTo) {
      filteredData = filteredData.filter((t) => {
        if (!t.dueDate) return false;
        const d = String(t.dueDate).slice(0, 10);
        return d <= filterDateTo;
      });
    }

    setFiltered(filteredData);
    setCurrentPage(1);
  }, [filterUser, filterCompany, filterPaid, filterStatus, filterDateFrom, filterDateTo, tickets]);

  // 🟢 pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filtered.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const paginate = (pageNumber) => setCurrentPage(Math.min(Math.max(1, pageNumber), totalPages));
  const nextPage = () => paginate(currentPage + 1);
  const prevPage = () => paginate(currentPage - 1);

  // ✅ Build pages list (1..N) بس بشكل مرتب
  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 7;
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    const left = Math.max(1, currentPage - 2);
    const right = Math.min(totalPages, currentPage + 2);

    pages.push(1);
    if (left > 2) pages.push("...");

    for (let i = left; i <= right; i++) {
      if (i !== 1 && i !== totalPages) pages.push(i);
    }

    if (right < totalPages - 1) pages.push("...");
    pages.push(totalPages);

    return pages;
  };

  // 🟢 excel export
  const exportToExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(
        filtered.map((t) => ({
          Title: t.title || "",
          Description: t.description || "",
          "Assigned To": t.assignedTo || "",
          "Created By": t.createdBy || "",
          Company: t.company || "—",
          Priority: t.priority || "",
          "Due Date": t.dueDate ? String(t.dueDate).slice(0, 10) : "—",
          "Done At": t.doneAt ? new Date(t.doneAt).toLocaleString() : "—",
          Status: t.status || "",
          Paid: t.paid || "",
          Rate: isBayan
          ? "*****"
          : t.rate
          ? `${Number(t.rate || 0).toLocaleString()} ${t.currency || ""}`
          : "—",
        }))
      );
  
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
  
      XLSX.writeFile(workbook, "tickets_report.xlsx");
    } catch (err) {
      console.error("❌ Export Excel error:", err);
      alert("صار خطأ بتصدير الإكسل");
    }
  };

  // 🧮 totals
  const totalIQD = tickets.reduce(
    (sum, t) => (t.currency === "IQD" ? sum + (parseFloat(t.rate) || 0) : sum),
    0
  );
  const totalUSD = tickets.reduce(
    (sum, t) => (t.currency === "USD" ? sum + (parseFloat(t.rate) || 0) : sum),
    0
  );
  const filteredIQD = filtered.reduce(
    (sum, t) => (t.currency === "IQD" ? sum + (parseFloat(t.rate) || 0) : sum),
    0
  );
  const filteredUSD = filtered.reduce(
    (sum, t) => (t.currency === "USD" ? sum + (parseFloat(t.rate) || 0) : sum),
    0
  );

  const anyFilterApplied =
    !!filterUser || !!filterCompany || !!filterPaid || !!filterStatus || !!filterDateFrom || !!filterDateTo;

  // =========================
  // ✅ Open Ticket in Popup + Load edit form
  // =========================
  const openTicket = (t) => {
    setSelectedTicket(t);
    setIsEditing(false);

    setEditForm({
      title: t.title || "",
      description: t.description || "",
      assignedTo: t.assignedTo ? { value: t.assignedTo, label: t.assignedTo } : null,
      createdBy: t.createdBy || "",
      company: t.company ? { value: t.company, label: t.company } : null,
      priority: t.priority || "",
      dueDate: t.dueDate ? String(t.dueDate).slice(0, 10) : "",
      status: t.status || "open",
      paid: t.paid || "no",
      rate: t.rate ?? "",
      currency: t.currency || "IQD",
    });
  };

  // =========================
  // ✅ Save edits
  // =========================
  const saveEdits = async () => {
    if (!selectedTicket) return;
    if (!canEditTicket(selectedTicket)) return;

    try {
      setSaving(true);

      const payload = {
        title: editForm.title,
        description: editForm.description,
        assignedTo: editForm.assignedTo?.value || "",
        createdBy: editForm.createdBy,
        company: editForm.company?.value || "",
        priority: editForm.priority,
        dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
        status: editForm.status,
        paid: editForm.paid,
        rate: isBayan
        ? selectedTicket.rate ?? null
        : editForm.rate === ""
        ? null
        : Number(editForm.rate),
      currency: isBayan ? selectedTicket.currency || "IQD" : editForm.currency,
      };

      const res = await fetch(`/api/tickets/${selectedTicket._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error || "فشل الحفظ");
        return;
      }

      const updated = await res.json();

      // ✅ تحديث محلي
      setTickets((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
      setFiltered((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
      setSelectedTicket(updated);
      setIsEditing(false);
    } catch (e) {
      console.error("❌ Save edit error:", e);
      alert("صار خطأ بالحفظ");
    } finally {
      setSaving(false);
    }
  };
  const pageIQD = currentRows.reduce(
    (sum, t) => (t.currency === "IQD" ? sum + (parseFloat(t.rate) || 0) : sum),
    0
  );
  
  const pageUSD = currentRows.reduce(
    (sum, t) => (t.currency === "USD" ? sum + (parseFloat(t.rate) || 0) : sum),
    0
  );

  const clearFilters = () => {
    setFilterUser(null);
    setFilterCompany(null);
    setFilterPaid(null);
    setFilterStatus(null);
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} tickets
            {anyFilterApplied ? " (filtered)" : ""} · Page {currentPage}/{totalPages}
          </p>
        </div>
        <button
          onClick={exportToExcel}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition shadow-sm"
        >
          <FaFileExcel />
          Export Excel
        </button>
      </div>

      {/* Stats */}
      {!isBayan && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Tickets" value={tickets.length.toString()} index={0} />
          <StatCard label="Filtered" value={filtered.length.toString()} index={1} />
          <StatCard
            label="Filtered IQD"
            value={`${filteredIQD.toLocaleString()} IQD`}
            index={2}
          />
          <StatCard
            label="Filtered USD"
            value={`${filteredUSD.toLocaleString()} USD`}
            index={3}
          />
        </div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Filters</h2>
          {anyFilterApplied && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
            >
              <FaTimes className="text-[10px]" />
              Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {isAdmin(currentUser) && (
            <FilterSelect
              label="User"
              options={userOptions}
              value={filterUser}
              onChange={setFilterUser}
              placeholder="All users"
            />
          )}
          <FilterSelect
            label="Company"
            options={companyOptions}
            value={filterCompany}
            onChange={setFilterCompany}
            placeholder="All companies"
          />
          <FilterSelect
            label="Status"
            options={[
              { value: "open", label: "Open" },
              { value: "in_progress", label: "In Progress" },
              { value: "done", label: "Done" },
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="All statuses"
          />
          <FilterSelect
            label="Paid"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={filterPaid}
            onChange={setFilterPaid}
            placeholder="All"
          />
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Due from
            </label>
            <input
              type="date"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Due to
            </label>
            <input
              type="date"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
        </div>
      </motion.div>

      {/* Pagination top */}
      {!loading && filtered.length > 0 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          filteredCount={filtered.length}
          onPrev={prevPage}
          onNext={nextPage}
          onPaginate={paginate}
          getPageNumbers={getPageNumbers}
          disabled={loading}
        />
      )}

      {/* Table */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm min-h-[320px] flex items-center justify-center">
          <LoadingSpinner message="Loading report..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <p className="text-slate-600 font-medium">No tickets match your filters</p>
          {anyFilterApplied && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-slate-500 hover:text-slate-800 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-950 text-slate-300 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3.5 text-left font-semibold">Title</th>
                  <th className="px-4 py-3.5 text-left font-semibold max-w-[200px]">Description</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Assigned</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Created By</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Company</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Priority</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Due</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Done At</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Status</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Paid</th>
                  <th className="px-4 py-3.5 text-right font-semibold">Rate</th>
                  <th className="px-4 py-3.5 text-center font-semibold w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRows.map((t) => (
                  <ReportTableRow
                    key={t._id}
                    ticket={t}
                    isBayan={isBayan}
                    isAdminUser={isAdmin(currentUser)}
                    onOpen={openTicket}
                    onToggleStatus={async (ticket) => {
                      const newStatus = ticket.status === "done" ? "open" : "done";
                      const res = await fetch(`/api/tickets/${ticket._id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: newStatus }),
                      });
                      if (res.ok) {
                        const updated = await res.json();
                        setTickets((prev) =>
                          prev.map((x) => (x._id === updated._id ? updated : x))
                        );
                        setFiltered((prev) =>
                          prev.map((x) => (x._id === updated._id ? updated : x))
                        );
                      }
                    }}
                    onMarkPaid={async (ticket) => {
                      if (ticket.paid === "yes") {
                        alert("❌ Cannot revert after Paid is Yes.");
                        return;
                      }
                      if (!isAdmin(currentUser)) return;
                      const res = await fetch(`/api/tickets/${ticket._id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ paid: "yes" }),
                      });
                      if (res.ok) {
                        const updated = await res.json();
                        setTickets((prev) =>
                          prev.map((x) => (x._id === updated._id ? updated : x))
                        );
                        setFiltered((prev) =>
                          prev.map((x) => (x._id === updated._id ? updated : x))
                        );
                      }
                    }}
                    onDelete={async (ticket) => {
                      if (!confirm("Delete this ticket?")) return;
                      const res = await fetch(`/api/tickets/${ticket._id}`, {
                        method: "DELETE",
                      });
                      if (res.ok) {
                        setTickets((prev) => prev.filter((x) => x._id !== ticket._id));
                        setFiltered((prev) => prev.filter((x) => x._id !== ticket._id));
                      } else {
                        alert("Delete failed");
                      }
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {!isBayan && (
            <ReportSubtotals pageIQD={pageIQD} pageUSD={pageUSD} currentPage={currentPage} />
          )}
        </motion.div>
      )}

      {totalPages > 1 && !loading && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          filteredCount={filtered.length}
          onPrev={prevPage}
          onNext={nextPage}
          onPaginate={paginate}
          getPageNumbers={getPageNumbers}
          disabled={loading}
        />
      )}

      {/* Detail Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setSelectedTicket(null);
            setIsEditing(false);
            setSaving(false);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 bg-slate-950">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  <StatusBadge status={selectedTicket.status} />
                  <PriorityBadge priority={selectedTicket.priority} />
                </div>
                <h2 className="text-lg font-semibold text-white truncate">
                  {selectedTicket.title}
                </h2>
              </div>
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setIsEditing(false);
                  setSaving(false);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {canEditTicket(selectedTicket)
                  ? "You can edit this ticket"
                  : "View only"}
              </p>
              {canEditTicket(selectedTicket) && (
                <div className="flex gap-2">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                    >
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          openTicket(selectedTicket);
                          setIsEditing(false);
                        }}
                        disabled={saving}
                        className="px-4 py-2 text-xs font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveEdits}
                        disabled={saving}
                        className="px-4 py-2 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 text-sm space-y-4">
              <DetailField label="Title" full>
                {isEditing ? (
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white mt-1"
                    value={editForm.title}
                    onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  />
                ) : (
                  <p className="font-medium text-slate-800 mt-1">{selectedTicket.title}</p>
                )}
              </DetailField>

              <DetailField label="Description" full>
                {isEditing ? (
                  <textarea
                    className="w-full min-h-[100px] border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white mt-1"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, description: e.target.value }))
                    }
                  />
                ) : (
                  <p className="text-slate-700 mt-1 whitespace-pre-wrap">
                    {selectedTicket.description || "—"}
                  </p>
                )}
              </DetailField>

              <div className="grid grid-cols-2 gap-3">
                <DetailField label="Assigned To">
                  {isEditing ? (
                    <Select
                      options={userOptions}
                      value={editForm.assignedTo}
                      onChange={(v) => setEditForm((p) => ({ ...p, assignedTo: v }))}
                      placeholder="Select user..."
                      isClearable
                      styles={selectStyles}
                      className="mt-1 text-sm"
                    />
                  ) : (
                    <p className="font-medium text-slate-800 mt-1">
                      {selectedTicket.assignedTo || "—"}
                    </p>
                  )}
                </DetailField>
                <DetailField label="Created By">
                  {isEditing ? (
                    <input
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1"
                      value={editForm.createdBy}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, createdBy: e.target.value }))
                      }
                    />
                  ) : (
                    <p className="font-medium text-slate-800 mt-1">{selectedTicket.createdBy}</p>
                  )}
                </DetailField>
                <DetailField label="Company">
                  {isEditing ? (
                    <Select
                      options={companyOptions}
                      value={editForm.company}
                      onChange={(v) => setEditForm((p) => ({ ...p, company: v }))}
                      placeholder="Select company..."
                      isClearable
                      styles={selectStyles}
                      className="mt-1 text-sm"
                    />
                  ) : (
                    <p className="font-medium text-slate-800 mt-1">
                      {selectedTicket.company || "—"}
                    </p>
                  )}
                </DetailField>
                <DetailField label="Priority">
                  {isEditing ? (
                    <input
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1"
                      value={editForm.priority}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, priority: e.target.value }))
                      }
                    />
                  ) : (
                    <div className="mt-1">
                      <PriorityBadge priority={selectedTicket.priority} />
                    </div>
                  )}
                </DetailField>
                <DetailField label="Due Date">
                  {isEditing ? (
                    <input
                      type="date"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1"
                      value={editForm.dueDate}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, dueDate: e.target.value }))
                      }
                    />
                  ) : (
                    <p className="font-medium text-slate-800 mt-1">
                      {selectedTicket.dueDate?.slice(0, 10) || "—"}
                    </p>
                  )}
                </DetailField>
                <DetailField label="Done At">
                  <p className="font-medium text-slate-800 mt-1">
                    {selectedTicket.doneAt
                      ? new Date(selectedTicket.doneAt).toLocaleString()
                      : "—"}
                  </p>
                </DetailField>
                <DetailField label="Status">
                  {isEditing ? (
                    <Select
                      options={[
                        { value: "open", label: "Open" },
                        { value: "in_progress", label: "In Progress" },
                        { value: "done", label: "Done" },
                      ]}
                      value={{
                        value: editForm.status,
                        label:
                          editForm.status === "done"
                            ? "Done"
                            : editForm.status === "in_progress"
                            ? "In Progress"
                            : "Open",
                      }}
                      onChange={(v) =>
                        setEditForm((p) => ({ ...p, status: v?.value || "open" }))
                      }
                      styles={selectStyles}
                      className="mt-1 text-sm"
                    />
                  ) : (
                    <div className="mt-1">
                      <StatusBadge status={selectedTicket.status} />
                    </div>
                  )}
                </DetailField>
                <DetailField label="Paid">
                  {isEditing ? (
                    <Select
                      options={[
                        { value: "yes", label: "Yes" },
                        { value: "no", label: "No" },
                      ]}
                      value={{
                        value: editForm.paid,
                        label: editForm.paid === "yes" ? "Yes" : "No",
                      }}
                      onChange={(v) =>
                        setEditForm((p) => ({ ...p, paid: v?.value || "no" }))
                      }
                      styles={selectStyles}
                      className="mt-1 text-sm"
                    />
                  ) : (
                    <div className="mt-1">
                      <PaidBadge paid={selectedTicket.paid} />
                    </div>
                  )}
                </DetailField>
              </div>

              <DetailField label="Rate" full>
                {isEditing ? (
                  <div className="mt-1 flex gap-2">
                    <input
                      type="text"
                      className={`flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm ${
                        isBayan ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""
                      }`}
                      value={isBayan ? "*****" : editForm.rate}
                      onChange={(e) => {
                        if (!isBayan)
                          setEditForm((p) => ({ ...p, rate: e.target.value }));
                      }}
                      disabled={isBayan}
                      readOnly={isBayan}
                    />
                    <Select
                      options={[
                        { value: "IQD", label: "IQD" },
                        { value: "USD", label: "USD" },
                      ]}
                      value={{ value: editForm.currency, label: editForm.currency }}
                      onChange={(v) => {
                        if (!isBayan)
                          setEditForm((p) => ({ ...p, currency: v?.value || "IQD" }));
                      }}
                      styles={selectStyles}
                      className="w-28 text-sm"
                      isDisabled={isBayan}
                    />
                  </div>
                ) : (
                  <p className="font-semibold text-slate-800 mt-1">
                    {isBayan
                      ? "*****"
                      : selectedTicket.rate
                      ? `${Number(selectedTicket.rate).toLocaleString()} ${selectedTicket.currency}`
                      : "—"}
                  </p>
                )}
              </DetailField>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setIsEditing(false);
                  setSaving(false);
                }}
                disabled={saving}
                className="px-5 py-2.5 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-slate-900 truncate">{value}</p>
    </motion.div>
  );
}

function FilterSelect({ label, options, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      <Select
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isClearable
        styles={selectStyles}
        className="text-sm"
      />
    </div>
  );
}

function PaginationBar({
  currentPage,
  totalPages,
  filteredCount,
  onPrev,
  onNext,
  onPaginate,
  getPageNumbers,
  disabled,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p className="text-xs text-slate-600">
        Page <span className="font-semibold">{currentPage}</span> /{" "}
        <span className="font-semibold">{totalPages}</span>
        {" · "}
        <span className="font-semibold">{filteredCount}</span> rows
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onPrev}
          disabled={currentPage <= 1 || disabled}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium disabled:opacity-40 hover:bg-slate-50"
        >
          ◀ Prev
        </button>
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) =>
            p === "..." ? (
              <span key={`dots-${idx}`} className="px-2 text-xs text-slate-400">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPaginate(p)}
                disabled={disabled}
                className={`min-w-[32px] px-2 py-1.5 rounded-lg border text-xs font-medium ${
                  p === currentPage
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>
        <button
          onClick={onNext}
          disabled={currentPage >= totalPages || disabled}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium disabled:opacity-40 hover:bg-slate-50"
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}

function DetailField({ label, children, full = false }) {
  return (
    <div
      className={`rounded-lg border border-slate-200 p-3 bg-slate-50/50 ${
        full ? "col-span-2" : ""
      }`}
    >
      <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
        {label}
      </h3>
      {children}
    </div>
  );
}

function ReportSubtotals({ pageIQD, pageUSD, currentPage }) {
  return (
    <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-4 pointer-events-none select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Page Subtotal
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Page {currentPage} only</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[160px] rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 mb-1">
              IQD
            </p>
            <p className="text-base font-bold text-slate-900 tabular-nums">
              {pageIQD.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-500">IQD</span>
            </p>
          </div>
          <div className="min-w-[160px] rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 mb-1">
              USD
            </p>
            <p className="text-base font-bold text-slate-900 tabular-nums">
              {pageUSD.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-500">USD</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HoverAction({ icon: Icon, label, onClick, variant = "default", disabled = false }) {
  const styles = {
    default: "text-slate-500 hover:text-slate-900 hover:bg-slate-200",
    success: "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50",
    danger: "text-red-500 hover:text-red-600 hover:bg-red-50",
  };

  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`p-2 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${styles[variant]}`}
    >
      <Icon className="text-sm" />
    </button>
  );
}

function ReportTableRow({
  ticket,
  isBayan,
  isAdminUser,
  onOpen,
  onToggleStatus,
  onMarkPaid,
  onDelete,
}) {
  const actionCount = 2 + (isAdminUser ? 2 : 0);

  return (
    <tr
      onClick={() => onOpen(ticket)}
      className="group cursor-pointer even:bg-slate-50/50 hover:bg-slate-100/90 transition-colors"
    >
      <td className="px-4 py-3 font-medium text-slate-800 max-w-[160px] truncate group-hover:text-slate-950">
        {ticket.title}
      </td>
      <td
        className="px-4 py-3 text-slate-600 max-w-[200px] truncate"
        title={ticket.description}
      >
        {ticket.description || "—"}
      </td>
      <td className="px-4 py-3 text-slate-700">{ticket.assignedTo || "—"}</td>
      <td className="px-4 py-3 text-slate-700">{ticket.createdBy || "—"}</td>
      <td className="px-4 py-3 text-slate-700">{ticket.company || "—"}</td>
      <td className="px-4 py-3">
        <PriorityBadge priority={ticket.priority} />
      </td>
      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
        {ticket.dueDate?.slice(0, 10) || "—"}
      </td>
      <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
        {ticket.doneAt ? new Date(ticket.doneAt).toLocaleString() : "—"}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={ticket.status} />
      </td>
      <td className="px-4 py-3">
        <PaidBadge paid={ticket.paid} />
      </td>
      <td className="px-4 py-3 text-right font-semibold text-slate-800 whitespace-nowrap">
        {isBayan
          ? "*****"
          : ticket.rate
          ? `${Number(ticket.rate).toLocaleString()} ${ticket.currency || ""}`
          : "—"}
      </td>
      <td
        className="px-2 py-3 align-middle w-[148px] min-w-[148px] max-w-[148px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-end gap-0.5 h-8"
          style={{ width: actionCount * 36 }}
        >
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto">
            <HoverAction
              icon={FaEye}
              label="View details"
              onClick={() => onOpen(ticket)}
            />
            <HoverAction
              icon={FaCheck}
              label={ticket.status === "done" ? "Reopen" : "Mark done"}
              variant="success"
              onClick={() => onToggleStatus(ticket)}
            />
            {isAdminUser && (
              <HoverAction
                icon={FaMoneyBillWave}
                label="Mark paid"
                variant="success"
                disabled={ticket.paid === "yes"}
                onClick={() => onMarkPaid(ticket)}
              />
            )}
            {isAdminUser && (
              <HoverAction
                icon={AiOutlineDelete}
                label="Delete"
                variant="danger"
                onClick={() => onDelete(ticket)}
              />
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}