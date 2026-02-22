"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
const Select = dynamic(() => import("react-select"), { ssr: false });
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { AiOutlineDelete } from "react-icons/ai";

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
      const res = await fetch("/api/tickets");
      const data = await res.json();

      if (Array.isArray(data)) {
        if (!isAdmin(user)) {
          const userName = user?.name || user?.username || "";
          const userTickets = data.filter((t) => t.assignedTo === userName);
          setTickets(userTickets);
          setFiltered(userTickets);
        } else {
          setTickets(data);
          setFiltered(data);
        }

        const uniqueUsers = [...new Set(data.map((t) => t.assignedTo).filter(Boolean))];
        setUserOptions(uniqueUsers.map((u) => ({ value: u, label: u })));

        const uniqueCompanies = [...new Set(data.map((t) => t.company).filter(Boolean))];
        setCompanyOptions(uniqueCompanies.map((c) => ({ value: c, label: c })));
      }
    } catch (err) {
      console.error("❌ Error fetching tickets:", err);
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
    const worksheet = XLSX.utils.json_to_sheet(
      filtered.map((t) => ({
        Title: t.title,
        Description: t.description,
        "Assigned To": t.assignedTo,
        "Created By": t.createdBy,
        Company: t.company || "—",
        Priority: t.priority,
        "Due Date": t.dueDate ? String(t.dueDate).slice(0, 10) : "—",
        "Done At": t.doneAt ? new Date(t.doneAt).toLocaleString() : "—",
        Status: t.status,
        Paid: t.paid,
        Rate: t.rate ? `${Number(t.rate || 0).toLocaleString()}${t.currency || ""}` : "—",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

    const excelBuffer = XLSX.utils.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `tickets_report.xlsx`);
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
        rate: editForm.rate === "" ? null : Number(editForm.rate),
        currency: editForm.currency,
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
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-gray-800">Tickets Report</h1>

        <div className="flex flex-wrap gap-2 items-center">
          {isAdmin(currentUser) && (
            <Select
              options={userOptions}
              value={filterUser}
              onChange={setFilterUser}
              placeholder="User..."
              isClearable
              className="w-36 text-xs"
            />
          )}

          <Select
            options={companyOptions}
            value={filterCompany}
            onChange={setFilterCompany}
            placeholder="Company..."
            isClearable
            className="w-36 text-xs"
          />

          <Select
            options={[
              { value: "open", label: "Open" },
              { value: "done", label: "Done" },
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="Status..."
            isClearable
            className="w-28 text-xs"
          />

          <Select
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={filterPaid}
            onChange={setFilterPaid}
            placeholder="Paid..."
            isClearable
            className="w-28 text-xs"
          />

          <input
            type="date"
            className="border rounded-md px-2 py-1 text-xs"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
          />
          <input
            type="date"
            className="border rounded-md px-2 py-1 text-xs"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
          />

          <button
            onClick={exportToExcel}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* ✅ Pagination controls (added) */}
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-xs text-gray-700">
          Page <b>{currentPage}</b> / <b>{totalPages}</b> — Rows: <b>{filtered.length}</b>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevPage}
            disabled={currentPage <= 1 || loading}
            className="px-2 py-1 rounded border bg-white text-xs disabled:opacity-50"
          >
            ◀ Prev
          </button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((p, idx) =>
              p === "..." ? (
                <span key={`dots-${idx}`} className="px-2 text-xs text-gray-500">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => paginate(p)}
                  disabled={loading}
                  className={`px-2 py-1 rounded border text-xs ${
                    p === currentPage ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-800"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage >= totalPages || loading}
            className="px-2 py-1 rounded border bg-white text-xs disabled:opacity-50"
          >
            Next ▶
          </button>

          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => paginate(Number(e.target.value || 1))}
            className="w-20 px-2 py-1 rounded border text-xs bg-white"
            disabled={loading}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <motion.div
            className="w-14 h-14 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
          <motion.table
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="min-w-full border border-gray-300 text-sm rounded-lg overflow-hidden shadow-sm"
          >
            <thead className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
              <tr>
                <th className="px-4 py-3 border border-gray-300 text-left">Title</th>
                <th className="px-4 py-3 border border-gray-300 text-left">Description</th>
                <th className="px-4 py-3 border border-gray-300 text-left">Assigned To</th>
                <th className="px-4 py-3 border border-gray-300 text-left">Created By</th>
                <th className="px-4 py-3 border border-gray-300 text-left">Company</th>
                <th className="px-4 py-3 border border-gray-300 text-left">Priority</th>
                <th className="px-4 py-3 border border-gray-300 text-left">Due Date</th>
                <th className="px-4 py-3 border border-gray-300 text-left">Done At</th>
                <th className="px-4 py-3 border border-gray-300 text-left">Status</th>
                <th className="px-4 py-3 border border-gray-300 text-left">Paid</th>
                <th className="px-12 py-3 border border-gray-300 text-left">Rate</th>
                {isAdmin(currentUser) && (
                  <th className="px-4 py-3 border border-gray-300 text-left">Delete</th>
                )}
              </tr>
            </thead>

            <motion.tbody
  className="divide-y divide-gray-200"
  key={`${currentPage}-${filtered.length}`}   // ✅ مهم
  initial="hidden"
  animate="show"
  variants={{
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }}
>
              {currentRows.map((t) => (
                <motion.tr
                  key={t._id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.3 }}
                  className="hover:bg-gray-100 even:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => openTicket(t)}
                >
                  <td className="px-4 py-2 border border-gray-200">{t.title}</td>
                  <td className="px-4 py-2 border border-gray-200 whitespace-pre-wrap break-words">
                    {t.description}
                  </td>
                  <td className="px-4 py-2 border border-gray-200">{t.assignedTo}</td>
                  <td className="px-4 py-2 border border-gray-200">{t.createdBy}</td>
                  <td className="px-4 py-2 border border-gray-200">{t.company || "—"}</td>
                  <td className="px-4 py-2 border border-gray-200">{t.priority}</td>
                  <td className="px-4 py-2 border border-gray-200">{t.dueDate?.slice(0, 10) || "—"}</td>
                  <td className="px-4 py-2 border border-gray-200">
                    {t.doneAt ? new Date(t.doneAt).toLocaleString() : "—"}
                  </td>

                  {/* Status */}
                  <td
                    onClick={async (e) => {
                      e.stopPropagation();
                      const newStatus = t.status === "done" ? "open" : "done";
                      const res = await fetch(`/api/tickets/${t._id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: newStatus }),
                      });
                      if (res.ok) {
                        const updated = await res.json();
                        setTickets((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
                        setFiltered((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
                      }
                    }}
                    className="px-4 py-2 border border-gray-200 font-semibold text-center cursor-pointer transition hover:bg-gray-200"
                  >
                    {t.status === "done" ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Done</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Open</span>
                    )}
                  </td>

                  {/* Paid */}
                  <td
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (t.paid === "yes") {
                        alert("❌ لا يمكن التراجع بعد وضع الحالة على Yes.");
                        return;
                      }
                      const res = await fetch(`/api/tickets/${t._id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ paid: "yes" }),
                      });
                      if (res.ok) {
                        const updated = await res.json();
                        setTickets((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
                        setFiltered((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
                      }
                    }}
                    className={`px-4 py-2 border border-gray-200 font-semibold text-center transition ${
                      isAdmin(currentUser)
                        ? t.paid === "yes"
                          ? "cursor-not-allowed bg-green-50"
                          : "cursor-pointer hover:bg-gray-200"
                        : "cursor-default bg-gray-50"
                    }`}
                  >
                    {t.paid === "yes" ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Yes</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">No</span>
                    )}
                  </td>

                  {/* Rate */}
                  <td className="px-4 py-2 border border-gray-200">
                    {t.rate ? (
                      <span>
                        {Number(t.rate || 0).toLocaleString()} <span className="ml-1">{t.currency}</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* Delete */}
                  {isAdmin(currentUser) && (
                    <td
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm("هل تريد بالتأكيد حذف هذا التكت؟")) {
                          const res = await fetch(`/api/tickets/${t._id}`, { method: "DELETE" });
                          if (res.ok) {
                            setTickets((prev) => prev.filter((x) => x._id !== t._id));
                            setFiltered((prev) => prev.filter((x) => x._id !== t._id));
                          } else {
                            alert("فشل الحذف");
                          }
                        }
                      }}
                      className="px-4 py-2 border border-gray-200 text-center text-red-600 cursor-pointer hover:bg-red-100 transition"
                    >
                      <AiOutlineDelete size={18} className="inline-block" />
                    </td>
                  )}
                </motion.tr>
              ))}
            </motion.tbody>

            <tfoot className="bg-gray-700 font-semibold text-white">
  <tr>
    <td colSpan="10" className="text-right px-4 py-3 border border-gray-600">
      Page Subtotal IQD:
    </td>
    <td className="px-4 py-3 border border-gray-600 text-right">
      {pageIQD.toLocaleString()} IQD
    </td>
    <td className="border border-gray-600"></td>
  </tr>

  <tr>
    <td colSpan="10" className="text-right px-4 py-3 border border-gray-600">
      Page Subtotal USD:
    </td>
    <td className="px-4 py-3 border border-gray-600 text-right">
      {pageUSD.toLocaleString()} USD
    </td>
    <td className="border border-gray-600"></td>
  </tr>
</tfoot>
          </motion.table>
        </div>
      )}

      {/* Popup (✅ now with Edit) */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 px-6 py-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Ticket Details</h2>
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setIsEditing(false);
                  setSaving(false);
                }}
                className="text-gray-300 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Actions */}
            <div className="px-6 py-3 border-b bg-gray-50 flex items-center justify-between">
              <div className="text-xs text-gray-600">
                {canEditTicket(selectedTicket) ? "تقدر تعدّل من هنا" : "عرض فقط (ما عندك صلاحية تعديل)"}
              </div>

              {canEditTicket(selectedTicket) && (
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          openTicket(selectedTicket); // يرجّع فورم على آخر نسخة
                          setIsEditing(false);
                        }}
                        className="px-3 py-1.5 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveEdits}
                        className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 text-sm text-gray-800 grid grid-cols-2 gap-4">
              {/* Title */}
              <div className="border rounded-lg p-3 col-span-2">
                <h3 className="text-xs text-gray-500">Title</h3>
                {isEditing ? (
                  <input
                    className="mt-1 w-full border rounded px-2 py-1 text-sm"
                    value={editForm.title}
                    onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  />
                ) : (
                  <p className="font-medium">{selectedTicket.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="border rounded-lg p-3 col-span-2">
                <h3 className="text-xs text-gray-500">Description</h3>
                {isEditing ? (
                  <textarea
                    className="mt-1 w-full min-h-[120px] border rounded px-2 py-1 text-sm whitespace-pre-wrap"
                    value={editForm.description}
                    onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  />
                ) : (
                  <p className="font-medium whitespace-pre-wrap break-words">{selectedTicket.description}</p>
                )}
              </div>

              {/* Assigned To */}
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Assigned To</h3>
                {isEditing ? (
                  <Select
                    options={userOptions}
                    value={editForm.assignedTo}
                    onChange={(v) => setEditForm((p) => ({ ...p, assignedTo: v }))}
                    placeholder="Select user..."
                    isClearable
                    className="mt-1 text-xs"
                  />
                ) : (
                  <p className="font-medium">{selectedTicket.assignedTo}</p>
                )}
              </div>

              {/* Created By */}
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Created By</h3>
                {isEditing ? (
                  <input
                    className="mt-1 w-full border rounded px-2 py-1 text-sm"
                    value={editForm.createdBy}
                    onChange={(e) => setEditForm((p) => ({ ...p, createdBy: e.target.value }))}
                  />
                ) : (
                  <p className="font-medium">{selectedTicket.createdBy}</p>
                )}
              </div>

              {/* Company */}
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Company</h3>
                {isEditing ? (
                  <Select
                    options={companyOptions}
                    value={editForm.company}
                    onChange={(v) => setEditForm((p) => ({ ...p, company: v }))}
                    placeholder="Select company..."
                    isClearable
                    className="mt-1 text-xs"
                  />
                ) : (
                  <p className="font-medium">{selectedTicket.company || "—"}</p>
                )}
              </div>

              {/* Priority */}
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Priority</h3>
                {isEditing ? (
                  <input
                    className="mt-1 w-full border rounded px-2 py-1 text-sm"
                    value={editForm.priority}
                    onChange={(e) => setEditForm((p) => ({ ...p, priority: e.target.value }))}
                  />
                ) : (
                  <p className="font-medium">{selectedTicket.priority}</p>
                )}
              </div>

              {/* Due Date */}
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Due Date</h3>
                {isEditing ? (
                  <input
                    type="date"
                    className="mt-1 w-full border rounded px-2 py-1 text-sm"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm((p) => ({ ...p, dueDate: e.target.value }))}
                  />
                ) : (
                  <p className="font-medium">{selectedTicket.dueDate?.slice(0, 10) || "—"}</p>
                )}
              </div>

              {/* Done At */}
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Done At</h3>
                <p className="font-medium">
                  {selectedTicket.doneAt ? new Date(selectedTicket.doneAt).toLocaleString() : "—"}
                </p>
              </div>

              {/* Status */}
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Status</h3>
                {isEditing ? (
                  <Select
                    options={[
                      { value: "open", label: "Open" },
                      { value: "done", label: "Done" },
                    ]}
                    value={{
                      value: editForm.status,
                      label: editForm.status === "done" ? "Done" : "Open",
                    }}
                    onChange={(v) => setEditForm((p) => ({ ...p, status: v?.value || "open" }))}
                    className="mt-1 text-xs"
                  />
                ) : (
                  <p className="font-medium">
                    {selectedTicket.status === "done" ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Done</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Open</span>
                    )}
                  </p>
                )}
              </div>

              {/* Paid */}
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Paid</h3>
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
                    onChange={(v) => setEditForm((p) => ({ ...p, paid: v?.value || "no" }))}
                    className="mt-1 text-xs"
                  />
                ) : (
                  <p className="font-medium">
                    {selectedTicket.paid === "yes" ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Yes</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">No</span>
                    )}
                  </p>
                )}
              </div>

              {/* Rate + Currency */}
              <div className="border rounded-lg p-3 col-span-2">
                <h3 className="text-xs text-gray-500">Rate</h3>
                {isEditing ? (
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number"
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={editForm.rate}
                      onChange={(e) => setEditForm((p) => ({ ...p, rate: e.target.value }))}
                      placeholder="Rate..."
                    />
                    <Select
                      options={[
                        { value: "IQD", label: "IQD" },
                        { value: "USD", label: "USD" },
                      ]}
                      value={{ value: editForm.currency, label: editForm.currency }}
                      onChange={(v) => setEditForm((p) => ({ ...p, currency: v?.value || "IQD" }))}
                      className="w-40 text-xs"
                    />
                  </div>
                ) : (
                  <p className="font-medium">
                    {selectedTicket.rate ? (
                      <span>
                        {Number(selectedTicket.rate || 0).toLocaleString()}{" "}
                        <span className="ml-1">{selectedTicket.currency}</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setIsEditing(false);
                  setSaving(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                disabled={saving}
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
