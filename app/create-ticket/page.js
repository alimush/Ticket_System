"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaSearch, FaTicketAlt } from "react-icons/fa";
import {
  getCurrentUser,
  canDeleteTicket,
  canMarkDone,
  canViewTicket,
} from "@/lib/permissions";
import TicketCard from "@/components/tickets/TicketCard";
import CreateTicketModal from "@/components/tickets/CreateTicketModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import { StatusBadge } from "@/components/tickets/TicketBadges";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

const TICKETS_PER_PAGE = 50;

export default function CreateTicketPage() {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [creating, setCreating] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [company, setCompany] = useState("");
  const [rate, setRate] = useState("");
  const [currency, setCurrency] = useState("IQD");

  const isBayan =
    (currentUser?.username || currentUser?.name || "").toLowerCase() === "bayan";

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUser(getCurrentUser());
    }
  }, []);

  const fetchTickets = async (user = currentUser) => {
    if (!user) return;
    try {
      setTicketsLoading(true);
      const res = await fetch("/api/tickets");
      const data = await res.json();
      let allTickets = Array.isArray(data) ? data : [];
      allTickets = allTickets.filter((t) => canViewTicket(user, t));
      setTickets(allTickets);
    } catch (err) {
      console.error("❌ Error fetching tickets:", err);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;

      try {
        setTicketsLoading(true);
        const [ticketsRes, usersRes, companiesRes] = await Promise.all([
          fetch("/api/tickets"),
          fetch("/api/users"),
          fetch("/api/companies"),
        ]);

        const ticketsData = await ticketsRes.json();
        const usersData = await usersRes.json();
        const companiesData = await companiesRes.json();

        let allTickets = Array.isArray(ticketsData) ? ticketsData : [];
        allTickets = allTickets.filter((t) => canViewTicket(currentUser, t));
        setTickets(allTickets);
        setUsers(Array.isArray(usersData.users) ? usersData.users : []);
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
      } catch (err) {
        console.error("❌ Error loading data:", err);
      } finally {
        setTicketsLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const resetCreateForm = () => {
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setPriority("medium");
    setDueDate("");
    setCompany("");
    setRate("");
    setCurrency("IQD");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (creating || !currentUser) return;

    try {
      setCreating(true);
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          assignedTo: assignedTo || null,
          priority,
          dueDate,
          createdBy: currentUser.username,
          company,
          paid: "no",
          doneAt: null,
          rate: isBayan ? null : rate ? Number(rate.replace(/,/g, "")) : null,
          currency,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        resetCreateForm();
        setCurrentPage(1);
        fetchTickets();
      }
    } catch (err) {
      console.error("❌ Error creating ticket:", err);
    } finally {
      setCreating(false);
    }
  };

  const markAsDone = async (id) => {
    await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    fetchTickets();
  };

  const deleteTicket = async (id) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    await fetch(`/api/tickets/${id}`, { method: "DELETE" });
    fetchTickets();
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = { all: tickets.length, open: 0, in_progress: 0, done: 0 };
    tickets.forEach((t) => {
      if (counts[t.status] !== undefined) counts[t.status]++;
    });
    return counts;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    });
  }, [tickets, statusFilter, searchQuery]);

  const sortedFiltered = useMemo(() => {
    return [...filteredTickets].sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [filteredTickets]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedFiltered.length / TICKETS_PER_PAGE)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * TICKETS_PER_PAGE;
    return sortedFiltered.slice(start, start + TICKETS_PER_PAGE);
  }, [sortedFiltered, currentPage]);

  // Date headers follow recency order within each page (not sorted by due date)
  const groupedByDate = useMemo(() => {
    const result = [];
    let currentDate = null;
    let currentGroup = [];

    for (const ticket of paginatedTickets) {
      const date = ticket.dueDate ? ticket.dueDate.slice(0, 10) : "No Date";
      if (date !== currentDate) {
        if (currentGroup.length) result.push([currentDate, currentGroup]);
        currentDate = date;
        currentGroup = [ticket];
      } else {
        currentGroup.push(ticket);
      }
    }

    if (currentGroup.length) result.push([currentDate, currentGroup]);
    return result;
  }, [paginatedTickets]);

  const paginatedTicketCount = paginatedTickets.length;

  const paginate = (page) =>
    setCurrentPage(Math.min(Math.max(1, page), totalPages));

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
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Tickets</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {tickets.length} total · {filteredTickets.length} matched
              {filteredTickets.length > 0 &&
                ` · Page ${currentPage}/${totalPages}`}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-slate-800 transition shadow-sm"
          >
            <FaPlus className="text-sm" />
            Create Ticket
          </button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* Status tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                  statusFilter === tab.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-slate-400">{statusCounts[tab.key]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {!ticketsLoading && filteredTickets.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
          <p className="text-xs text-slate-600">
            Page <span className="font-semibold">{currentPage}</span> /{" "}
            <span className="font-semibold">{totalPages}</span>
            {" · "}
            Showing{" "}
            <span className="font-semibold">{paginatedTicketCount}</span> of{" "}
            <span className="font-semibold">{filteredTickets.length}</span> tickets
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition"
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
                    onClick={() => paginate(p)}
                    className={`min-w-[32px] px-2 py-1.5 rounded-lg border text-xs font-medium transition ${
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
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Next ▶
            </button>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => paginate(Number(e.target.value || 1))}
              className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-900"
            />
          </div>
        </div>
      )}

      {/* Tickets grouped by due date */}
      {ticketsLoading ? (
        <LoadingSpinner message="Loading tickets..." />
      ) : filteredTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <FaTicketAlt className="text-2xl text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No tickets found</h3>
          <p className="text-sm text-slate-500 mb-5 max-w-sm">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Create your first ticket to get started."}
          </p>
          {!searchQuery && statusFilter === "all" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-slate-800 transition"
            >
              <FaPlus className="text-xs" />
              Create Ticket
            </button>
          )}
        </div>
      ) : (
        <motion.div
          key={currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="space-y-10"
        >
          {(() => {
            let cardIndex = 0;
            return groupedByDate.map(([date, group], idx) => (
              <motion.div
                key={`${currentPage}-${idx}-${date}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                className={`pt-2 ${idx > 0 ? "border-t border-slate-200" : ""}`}
              >
                <h2 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  {date}
                  <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {group.length} tickets
                  </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.map((ticket) => {
                    const index = cardIndex++;
                    return (
                      <TicketCard
                        key={ticket._id}
                        ticket={ticket}
                        index={index}
                        hideRate={isBayan}
                        canDelete={canDeleteTicket(currentUser)}
                        onClick={() => setSelectedTicket(ticket)}
                        onDelete={deleteTicket}
                      />
                    );
                  })}
                </div>
              </motion.div>
            ));
          })()}
        </motion.div>
      )}

      {/* Bottom pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              ◀ Prev
            </button>
            <span className="text-xs text-slate-600 px-2">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Next ▶
            </button>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <CreateTicketModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              resetCreateForm();
            }}
            onSubmit={handleCreate}
            loading={creating}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            assignedTo={assignedTo}
            setAssignedTo={setAssignedTo}
            company={company}
            setCompany={setCompany}
            priority={priority}
            setPriority={setPriority}
            dueDate={dueDate}
            setDueDate={setDueDate}
            rate={rate}
            setRate={setRate}
            currency={currency}
            setCurrency={setCurrency}
            users={users}
            companies={companies}
            isBayan={isBayan}
          />
        )}
      </AnimatePresence>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setIsEditing(false);
            setSelectedTicket(null);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 bg-slate-900">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <StatusBadge status={selectedTicket.status} />
                </div>
                <h2 className="text-lg font-semibold text-white truncate">
                  {selectedTicket.title}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedTicket(null);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-800 space-y-4">
              {isEditing && (
                <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
                  <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">
                    Title
                  </h3>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white"
                    value={editForm.title || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Assigned To", key: "assignedTo", type: "text" },
                  { label: "Company", key: "company", type: "text" },
                  { label: "Priority", key: "priority", type: "select" },
                  { label: "Due Date", key: "dueDate", type: "date" },
                ].map(({ label, key, type }) => (
                  <div key={key} className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
                    <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">
                      {label}
                    </h3>
                    {isEditing ? (
                      type === "select" ? (
                        <select
                          className="w-full border border-slate-200 rounded-lg p-1.5 text-sm bg-white"
                          value={editForm[key] || "medium"}
                          onChange={(e) =>
                            setEditForm({ ...editForm, [key]: e.target.value })
                          }
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      ) : (
                        <input
                          type={type}
                          className="w-full border border-slate-200 rounded-lg p-1.5 text-sm bg-white"
                          value={editForm[key] || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, [key]: e.target.value })
                          }
                        />
                      )
                    ) : (
                      <p className="font-medium text-slate-800">
                        {key === "dueDate"
                          ? selectedTicket.dueDate?.slice(0, 10) || "—"
                          : selectedTicket[key] || "—"}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
                <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">
                  Description
                </h3>
                {isEditing ? (
                  <textarea
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white min-h-[80px]"
                    value={editForm.description || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {selectedTicket.description || "—"}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
                <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">
                  Rate
                </h3>
                {isEditing ? (
                  <input
                    type="text"
                    className={`w-full border border-slate-200 rounded-lg p-1.5 text-sm bg-white ${
                      isBayan ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""
                    }`}
                    value={isBayan ? "*****" : editForm.rate || ""}
                    onChange={(e) => {
                      if (!isBayan) setEditForm({ ...editForm, rate: e.target.value });
                    }}
                    disabled={isBayan}
                    readOnly={isBayan}
                  />
                ) : (
                  <p className="font-medium text-slate-800">
                    {isBayan
                      ? "*****"
                      : selectedTicket.rate
                      ? `${selectedTicket.rate.toLocaleString()} ${selectedTicket.currency || ""}`
                      : "—"}
                  </p>
                )}
              </div>

              {selectedTicket.status === "done" && selectedTicket.doneAt && (
                <div className="rounded-lg border border-emerald-200 p-3 bg-emerald-50">
                  <h3 className="text-[11px] font-medium text-emerald-600 uppercase tracking-wide mb-1">
                    Done At
                  </h3>
                  <p className="font-medium text-emerald-800">
                    {new Date(selectedTicket.doneAt).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
                <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">
                  Paid
                </h3>
                {currentUser?.role === "admin" ? (
                  <div className="flex gap-2">
                    {["yes", "no"].map((val) => (
                      <button
                        key={val}
                        disabled={val === "no" && selectedTicket.paid === "yes"}
                        onClick={async () => {
                          const res = await fetch(`/api/tickets/${selectedTicket._id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ paid: val }),
                          });
                          if (res.ok) {
                            const updated = await res.json();
                            setSelectedTicket(updated);
                            setTickets((prev) =>
                              prev.map((t) => (t._id === updated._id ? updated : t))
                            );
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          selectedTicket.paid === val
                            ? val === "yes"
                              ? "bg-emerald-600 text-white"
                              : "bg-red-600 text-white"
                            : val === "no" && selectedTicket.paid === "yes"
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {val === "yes" ? "Yes" : "No"}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="font-medium">
                    {selectedTicket.paid === "yes" ? (
                      <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-600">
                        No
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50">
              {isEditing ? (
                <>
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/tickets/${selectedTicket._id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ...editForm,
                          assignedTo: editForm.assignedTo || null,
                          rate: isBayan
                            ? selectedTicket.rate ?? null
                            : editForm.rate,
                        }),
                      });
                      if (res.ok) {
                        const updated = await res.json();
                        setSelectedTicket(updated);
                        setTickets((prev) =>
                          prev.map((t) => (t._id === updated._id ? updated : t))
                        );
                        setIsEditing(false);
                      }
                    }}
                    className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {selectedTicket.status !== "done" &&
                    canMarkDone(currentUser, selectedTicket) && (
                      <button
                        onClick={() => {
                          markAsDone(selectedTicket._id);
                          setSelectedTicket(null);
                        }}
                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
                      >
                        Mark as Done
                      </button>
                    )}
                  {currentUser?.role === "admin" && (
                    <button
                      onClick={() => {
                        setEditForm({
                          title: selectedTicket.title || "",
                          description: selectedTicket.description || "",
                          assignedTo: selectedTicket.assignedTo || "",
                          priority: selectedTicket.priority || "medium",
                          dueDate: selectedTicket.dueDate
                            ? selectedTicket.dueDate.slice(0, 10)
                            : "",
                          company: selectedTicket.company || "",
                          rate: selectedTicket.rate
                            ? selectedTicket.rate.toString()
                            : "",
                          currency: selectedTicket.currency || "IQD",
                        });
                        setIsEditing(true);
                      }}
                      className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedTicket(null);
                    }}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
