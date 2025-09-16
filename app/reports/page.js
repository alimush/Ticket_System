"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Select from "react-select";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import NoPermission from "@/components/NoPermission";
import { AiOutlineDelete } from "react-icons/ai";

export default function ReportPage() {
  const [tickets, setTickets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

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

  // 🟢 fetch tickets
  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTickets(data);
        setFiltered(data);

        // unique users
        const uniqueUsers = [
          ...new Set(data.map((t) => t.assignedTo).filter(Boolean)),
        ];
        setUserOptions(uniqueUsers.map((u) => ({ value: u, label: u })));

        // unique companies
        const uniqueCompanies = [
          ...new Set(data.map((t) => t.company).filter(Boolean)),
        ];
        setCompanyOptions(uniqueCompanies.map((c) => ({ value: c, label: c })));
      }
    } catch (err) {
      console.error("❌ Error fetching tickets:", err);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUser(getCurrentUser());
    }
    fetchTickets();
  }, []);

  // 🟢 filter
  useEffect(() => {
    let filteredData = [...tickets];
    if (filterUser) {
      filteredData = filteredData.filter(
        (t) => t.assignedTo === filterUser.value
      );
    }
    if (filterCompany) {
      filteredData = filteredData.filter(
        (t) => t.company === filterCompany.value
      );
    }
    if (filterPaid) {
      filteredData = filteredData.filter((t) => t.paid === filterPaid.value);
    }
    if (filterDateFrom) {
      filteredData = filteredData.filter(
        (t) => t.dueDate && t.dueDate >= filterDateFrom
      );
    }
    if (filterDateTo) {
      filteredData = filteredData.filter(
        (t) => t.dueDate && t.dueDate <= filterDateTo
      );
    }
    setFiltered(filteredData);
    setCurrentPage(1); // رجع للبداية عند الفلترة
  }, [filterUser, filterCompany, filterPaid, filterDateFrom, filterDateTo, tickets]);

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
        "Due Date": t.dueDate ? t.dueDate.slice(0, 10) : "—",
        "Done At": t.doneAt ? new Date(t.doneAt).toLocaleString() : "—",
        Status: t.status,
        Paid: t.paid,
        Rate: t.rate ? `${t.rate.toLocaleString()}${t.currency || ""}` : "—",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `tickets_report.xlsx`
    );
  };

  // 🟢 only admin
  if (!currentUser) return null;
  if (!isAdmin(currentUser)) return <NoPermission />;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-gray-800">Tickets Report</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <Select
            options={userOptions}
            value={filterUser}
            onChange={setFilterUser}
            placeholder="User..."
            isClearable
            className="w-36 text-xs"
          />
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
      <div className="overflow-x-auto bg-white rounded-lg shadow border">
        <motion.table
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="min-w-full border border-gray-300 text-sm"
        >
          <thead className="bg-gray-800 text-white">
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
              <th className="px-4 py-3 border border-gray-300 text-left">Delete</th>
            </tr>
          </thead>

          <motion.tbody
            className="divide-y divide-gray-200"
            key={filtered.length} // ✅ يخلي الأنيميشن يشتغل لما يتغير الفلتر
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.05 },
              },
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
                className="hover:bg-blue-50 even:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedTicket(t)}
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
                  {t.dueDate?.slice(0, 10) || "—"}
                </td>
                <td className="px-4 py-2 border border-gray-200">
                  {t.doneAt ? new Date(t.doneAt).toLocaleString() : "—"}
                </td>
                <td
  onClick={async (e) => {
    e.stopPropagation(); // حتى ما يفتح الـ popup
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
    }
  }}
  className="px-4 py-2 border border-gray-200 font-semibold text-center cursor-pointer transition hover:bg-yellow-100"
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
                <td
  onClick={async (e) => {
    e.stopPropagation(); // حتى ما يفتح الـ popup
    const newPaid = t.paid === "yes" ? "no" : "yes";
    const res = await fetch(`/api/tickets/${t._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: newPaid }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket._id === updated._id ? updated : ticket
        )
      );
      setFiltered((prev) =>
        prev.map((ticket) =>
          ticket._id === updated._id ? updated : ticket
        )
      );
    }
  }}
  className="px-4 py-2 border border-gray-200 font-semibold text-center cursor-pointer hover:bg-yellow-100 transition"
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
<td className="px-4 py-2 border border-gray-200">
  {t.rate ? (
    <span>
      {t.rate.toLocaleString()} <span className="ml-1">{t.currency}</span>
    </span>
  ) : (
    "—"
  )}
</td>
<td
  onClick={async (e) => {
    e.stopPropagation(); // حتى ما يفتح الـ popup

    if (confirm("هل تريد بالتأكيد حذف هذا التكت؟")) {
      const res = await fetch(`/api/tickets/${t._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setTickets((prev) => prev.filter((ticket) => ticket._id !== t._id));
        setFiltered((prev) => prev.filter((ticket) => ticket._id !== t._id));
      } else {
        alert("فشل الحذف");
      }
    }
  }}
  className="px-4 py-2 border border-gray-200 text-center text-red-600 cursor-pointer hover:bg-red-100 transition"
>
  <AiOutlineDelete size={18} className="inline-block" />
</td>
              </motion.tr>
            ))}
          </motion.tbody>
        </motion.table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4 gap-2 text-xs">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => paginate(i + 1)}
            className={`px-2 py-1 rounded ${
              currentPage === i + 1
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

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
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-300 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 text-sm text-gray-800 grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-3 col-span-2">
                <h3 className="text-xs text-gray-500">Title</h3>
                <p className="font-medium">{selectedTicket.title}</p>
              </div>
              <div className="border rounded-lg p-3 col-span-2">
                <h3 className="text-xs text-gray-500">Description</h3>
                <p className="font-medium whitespace-pre-wrap break-words">
                  {selectedTicket.description}
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Assigned To</h3>
                <p className="font-medium">{selectedTicket.assignedTo}</p>
              </div>
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Created By</h3>
                <p className="font-medium">{selectedTicket.createdBy}</p>
              </div>
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Company</h3>
                <p className="font-medium">{selectedTicket.company || "—"}</p>
              </div>
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Priority</h3>
                <p className="font-medium">{selectedTicket.priority}</p>
              </div>
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Due Date</h3>
                <p className="font-medium">
                  {selectedTicket.dueDate?.slice(0, 10) || "—"}
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Done At</h3>
                <p className="font-medium">
                  {selectedTicket.doneAt
                    ? new Date(selectedTicket.doneAt).toLocaleString()
                    : "—"}
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Status</h3>
                <p className="font-medium">
                  {selectedTicket.status === "done" ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                      Done
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                      {selectedTicket.status}
                    </span>
                  )}
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <h3 className="text-xs text-gray-500">Paid</h3>
                <p className="font-medium">
                  {selectedTicket.paid === "yes" ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                      Yes
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                      No
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="px-6 py-3 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedTicket(null)}
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