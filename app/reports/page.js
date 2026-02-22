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

  // ✅ Popup Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    createdBy: "",
    company: "",
    priority: "medium",
    dueDate: "",
    status: "open",
    paid: "no",
    rate: "",
    currency: "IQD",
  });

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

    if (filterDateFrom) {
      filteredData = filteredData.filter((t) => t.dueDate && String(t.dueDate).slice(0, 10) >= filterDateFrom);
    }

    if (filterStatus) filteredData = filteredData.filter((t) => t.status === filterStatus.value);

    if (filterDateTo) {
      filteredData = filteredData.filter((t) => t.dueDate && String(t.dueDate).slice(0, 10) <= filterDateTo);
    }

    setFiltered(filteredData);
    setCurrentPage(1);
  }, [filterUser, filterCompany, filterPaid, filterStatus, filterDateFrom, filterDateTo, tickets]);

  // 🟢 pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filtered.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
        Rate: t.rate ? `${Number(t.rate).toLocaleString()}${t.currency || ""}` : "—",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
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

  // ✅ Popup helpers
  const fillEditFormFromTicket = (t) => {
    setEditForm({
      title: t?.title || "",
      description: t?.description || "",
      assignedTo: t?.assignedTo || "",
      createdBy: t?.createdBy || "",
      company: t?.company || "",
      priority: t?.priority || "medium",
      dueDate: t?.dueDate ? String(t.dueDate).slice(0, 10) : "",
      status: t?.status || "open",
      paid: t?.paid || "no",
      rate: t?.rate ?? "",
      currency: t?.currency || "IQD",
    });
  };

  const onEditChange = (key, value) => setEditForm((p) => ({ ...p, [key]: value }));

  const saveEdits = async () => {
    if (!selectedTicket?._id) return;

    const payload = {
      title: editForm.title,
      description: editForm.description,
      assignedTo: editForm.assignedTo,
      company: editForm.company,
      priority: editForm.priority,
      dueDate: editForm.dueDate || null,
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
      alert("فشل الحفظ");
      return;
    }

    const updated = await res.json();

    setTickets((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
    setFiltered((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
    setSelectedTicket(updated);
    setIsEditing(false);
  };

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
              key={filtered.length}
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
                  onClick={() => {
                    setSelectedTicket(t);
                    setIsEditing(false);
                    fillEditFormFromTicket(t);
                  }}
                >
                  <td className="px-4 py-2 border border-gray-200">{t.title}</td>
                  <td className="px-4 py-2 border border-gray-200 whitespace-pre-wrap break-words">
                    {t.description}
                  </td>
                  <td className="px-4 py-2 border border-gray-200">{t.assignedTo}</td>
                  <td className="px-4 py-2 border border-gray-200">{t.createdBy}</td>
                  <td className="px-4 py-2 border border-gray-200">{t.company || "—"}</td>
                  <td className="px-4 py-2 border border-gray-200">{t.priority}</td>
                  <td className="px-4 py-2 border border-gray-200">
                    {t.dueDate ? String(t.dueDate).slice(0, 10) : "—"}
                  </td>
                  <td className="px-4 py-2 border border-gray-200">
                    {t.doneAt ? new Date(t.doneAt).toLocaleString() : "—"}
                  </td>

                  {/* ✅ Status toggle from table */}
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
                        setTickets((prev) =>
                          prev.map((ticket) => (ticket._id === updated._id ? updated : ticket))
                        );
                        setFiltered((prev) =>
                          prev.map((ticket) => (ticket._id === updated._id ? updated : ticket))
                        );
                        if (selectedTicket?._id === updated._id) {
                          setSelectedTicket(updated);
                          fillEditFormFromTicket(updated);
                        }
                      }
                    }}
                    className="px-4 py-2 border border-gray-200 font-semibold text-center cursor-pointer transition hover:bg-gray-200"
                  >
                    {t.status === "done" ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        Done
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                        Open
                      </span>
                    )}
                  </td>

                  {/* ✅ Paid toggle from table */}
                  <td
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!isAdmin(currentUser)) return;
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
                        setTickets((prev) =>
                          prev.map((ticket) => (ticket._id === updated._id ? updated : ticket))
                        );
                        setFiltered((prev) =>
                          prev.map((ticket) => (ticket._id === updated._id ? updated : ticket))
                        );
                        if (selectedTicket?._id === updated._id) {
                          setSelectedTicket(updated);
                          fillEditFormFromTicket(updated);
                        }
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
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                        No
                      </span>
                    )}
                  </td>

                  {/* ✅ Rate */}
                  <td className="px-4 py-2 border border-gray-200">
                    {t.rate ? (
                      <span>
                        {Number(t.rate).toLocaleString()} <span className="ml-1">{t.currency}</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* ✅ Delete */}
                  {isAdmin(currentUser) && (
                    <td
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm("هل تريد بالتأكيد حذف هذا التكت؟")) {
                          const res = await fetch(`/api/tickets/${t._id}`, { method: "DELETE" });
                          if (res.ok) {
                            setTickets((prev) => prev.filter((ticket) => ticket._id !== t._id));
                            setFiltered((prev) => prev.filter((ticket) => ticket._id !== t._id));
                            if (selectedTicket?._id === t._id) setSelectedTicket(null);
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

            {/* Footer totals */}
            <tfoot className="bg-gray-700 font-semibold text-white">
              <tr>
                <td colSpan="10" className="text-right px-4 py-3 border border-gray-600">
                  Subtotal IQD:
                </td>
                <td className="px-4 py-3 border border-gray-600 text-right">
                  {(
                    filterUser ||
                    filterCompany ||
                    filterPaid ||
                    filterStatus ||
                    filterDateFrom ||
                    filterDateTo
                      ? filteredIQD
                      : totalIQD
                  ).toLocaleString()}{" "}
                  IQD
                </td>
                <td className="border border-gray-600"></td>
              </tr>
              <tr>
                <td colSpan="10" className="text-right px-4 py-3 border border-gray-600">
                  Subtotal USD:
                </td>
                <td className="px-4 py-3 border border-gray-600 text-right">
                  {(
                    filterUser ||
                    filterCompany ||
                    filterPaid ||
                    filterStatus ||
                    filterDateFrom ||
                    filterDateTo
                      ? filteredUSD
                      : totalUSD
                  ).toLocaleString()}{" "}
                  USD
                </td>
                <td className="border border-gray-600"></td>
              </tr>
            </tfoot>
          </motion.table>

          {/* ✅ Pagination (اختياري بسيط) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3">
              <div className="text-xs text-gray-600">
                Page {currentPage} / {totalPages} • Rows: {filtered.length.toLocaleString()}
              </div>

              <div className="flex gap-1 flex-wrap">
                <button
                  className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </button>

                <button
                  className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Popup */}
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

              <div className="flex items-center gap-2">
                {isAdmin(currentUser) && (
                  <>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1 text-xs rounded bg-white/10 text-white hover:bg-white/20"
                      >
                        Edit
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={saveEdits}
                          className="px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            fillEditFormFromTicket(selectedTicket);
                            setIsEditing(false);
                          }}
                          className="px-3 py-1 text-xs rounded bg-gray-400 text-gray-900 hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </>
                )}

                <button
                  onClick={() => {
                    setSelectedTicket(null);
                    setIsEditing(false);
                  }}
                  className="text-gray-300 hover:text-white transition"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 text-sm text-gray-800 grid grid-cols-2 gap-4">
              {/* Title */}
              <div className="border rounded-lg p-3 col-span-2">
                <h3 className="text-xs text-gray-500">Title</h3>
                {!isEditing ? (
                  <p className="font-medium">{selectedTicket.title}</p>
                ) : (
                  <input
                    className="w-full mt-1 border rounded px-2 py-1 text-sm"
                    value={editForm.title}
                    onChange={(e) => onEditChange("title", e.target.value)}
                  />
                )}
              </div>

              {/* Description */}
              <div className="border rounded-lg p-3 col-span-2">
                <h3 className="text-xs text-gray-500">Description</h3>
                {!isEditing ? (
                  <p className="font-medium whitespace-pre-wrap break-words">
                    {selectedTicket.description}
                  </p>
                ) : (
                  <textarea
                    className="w-full mt-1 border rounded px-2 py-2 text-sm min-h-[120px]"
                    value={editForm.description}
                    onChange={(e) => onEditChange("description", e.target.value)}
                  />
                )}
              </div>

              {/* Assigned To */}
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Assigned To</h3>
                {!isEditing ? (
                  <p className="font-medium">{selectedTicket.assignedTo}</p>
                ) : (
                  <input
                    className="w-full mt-1 border rounded px-2 py-1 text-sm"
                    value={editForm.assignedTo}
                    onChange={(e) => onEditChange("assignedTo", e.target.value)}
                    placeholder="Assigned To..."
                  />
                )}
              </div>

              {/* Created By (قراءة فقط) */}
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Created By</h3>
                <p className="font-medium">{selectedTicket.createdBy}</p>
              </div>

              {/* Company */}
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Company</h3>
                {!isEditing ? (
                  <p className="font-medium">{selectedTicket.company || "—"}</p>
                ) : (
                  <input
                    className="w-full mt-1 border rounded px-2 py-1 text-sm"
                    value={editForm.company}
                    onChange={(e) => onEditChange("company", e.target.value)}
                    placeholder="Company..."
                  />
                )}
              </div>

              {/* Priority */}
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Priority</h3>
                {!isEditing ? (
                  <p className="font-medium">{selectedTicket.priority}</p>
                ) : (
                  <select
                    className="w-full mt-1 border rounded px-2 py-1 text-sm"
                    value={editForm.priority}
                    onChange={(e) => onEditChange("priority", e.target.value)}
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                )}
              </div>

              {/* Due Date */}
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Due Date</h3>
                {!isEditing ? (
                  <p className="font-medium">{selectedTicket.dueDate ? String(selectedTicket.dueDate).slice(0, 10) : "—"}</p>
                ) : (
                  <input
                    type="date"
                    className="w-full mt-1 border rounded px-2 py-1 text-sm"
                    value={editForm.dueDate}
                    onChange={(e) => onEditChange("dueDate", e.target.value)}
                  />
                )}
              </div>

              {/* Done At (قراءة فقط) */}
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Done At</h3>
                <p className="font-medium">
                  {selectedTicket.doneAt ? new Date(selectedTicket.doneAt).toLocaleString() : "—"}
                </p>
              </div>

              {/* Status */}
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Status</h3>
                {!isEditing ? (
                  <p className="font-medium">{selectedTicket.status}</p>
                ) : (
                  <select
                    className="w-full mt-1 border rounded px-2 py-1 text-sm"
                    value={editForm.status}
                    onChange={(e) => onEditChange("status", e.target.value)}
                  >
                    <option value="open">open</option>
                    <option value="done">done</option>
                  </select>
                )}
              </div>

              {/* Paid */}
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Paid</h3>
                {!isEditing ? (
                  <p className="font-medium">{selectedTicket.paid}</p>
                ) : (
                  <select
                    className="w-full mt-1 border rounded px-2 py-1 text-sm"
                    value={editForm.paid}
                    onChange={(e) => onEditChange("paid", e.target.value)}
                  >
                    <option value="no">no</option>
                    <option value="yes">yes</option>
                  </select>
                )}
              </div>

              {/* Rate + Currency */}
              <div className="border rounded-lg p-3 col-span-2">
                <h3 className="text-xs text-gray-500">Rate</h3>
                {!isEditing ? (
                  <p className="font-medium">
                    {selectedTicket.rate
                      ? `${Number(selectedTicket.rate).toLocaleString()} ${selectedTicket.currency || ""}`
                      : "—"}
                  </p>
                ) : (
                  <div className="flex gap-2 mt-1">
                    <input
                      type="number"
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      value={editForm.rate}
                      onChange={(e) => onEditChange("rate", e.target.value)}
                      placeholder="Rate..."
                    />
                    <select
                      className="w-28 border rounded px-2 py-1 text-sm"
                      value={editForm.currency}
                      onChange={(e) => onEditChange("currency", e.target.value)}
                    >
                      <option value="IQD">IQD</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setIsEditing(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
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
