"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Select from "react-select";
import {
  getCurrentUser,
  canMarkDone,
} from "@/lib/permissions";

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUser(getCurrentUser());
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [ticketRes, usersRes, companiesRes] = await Promise.all([
          fetch(`/api/tickets/${id}`, { cache: "no-store" }),
          fetch(`/api/users`, { cache: "no-store" }),
          fetch(`/api/companies`, { cache: "no-store" }),
        ]);

        const ticketData = await ticketRes.json();
        const usersData = await usersRes.json();
        const companiesData = await companiesRes.json();

        if (!ticketRes.ok) {
          throw new Error(ticketData.error || "Failed to load ticket");
        }

        setTicket(ticketData);
        setUsers(Array.isArray(usersData.users) ? usersData.users : []);
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
      } catch (err) {
        console.error("❌ Error loading ticket page:", err);
        setError(err.message || "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    };

    if (id) loadData();
  }, [id]);

  const formatDate = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const startEdit = () => {
    if (!ticket) return;

    setEditForm({
      title: ticket.title || "",
      description: ticket.description || "",
      assignedTo: ticket.assignedTo || "",
      priority: ticket.priority || "medium",
      dueDate: ticket.dueDate ? ticket.dueDate.slice(0, 10) : "",
      company: ticket.company || "",
      rate: ticket.rate ? ticket.rate.toString() : "",
      currency: ticket.currency || "IQD",
    });

    setIsEditing(true);
  };

  const saveEdit = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticket._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          rate: editForm.rate ? Number(String(editForm.rate).replace(/,/g, "")) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update ticket");
      }

      setTicket(data);
      setIsEditing(false);
    } catch (err) {
      console.error("❌ Save error:", err);
      alert(err.message || "Failed to update ticket");
    }
  };

  const markAsDone = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticket._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to mark ticket as done");
      }

      setTicket(data);
    } catch (err) {
      console.error("❌ Mark done error:", err);
      alert(err.message || "Failed to mark ticket as done");
    }
  };

  const updatePaid = async (paidValue) => {
    try {
      const res = await fetch(`/api/tickets/${ticket._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: paidValue }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update paid status");
      }

      setTicket(data);
    } catch (err) {
      console.error("❌ Paid update error:", err);
      alert(err.message || "Failed to update paid status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl px-8 py-6 text-gray-700 font-medium">
          Loading ticket details...
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-3">Error</h2>
          <p className="text-gray-700 mb-5">{error || "Ticket not found"}</p>
          <button
            onClick={() => router.push("/tickets")}
            className="px-5 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition"
          >
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 rounded-2xl shadow-2xl px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Ticket Details</h1>
            <p className="text-gray-300 text-sm mt-1">
              Ticket ID: {ticket._id}
            </p>
          </div>

          <button
            onClick={() => router.push("/tickets")}
            className="px-5 py-2 rounded-lg bg-white text-gray-800 font-medium hover:bg-gray-100 transition"
          >
            Back
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between gap-3">
            {isEditing ? (
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-lg font-bold text-gray-800"
                value={editForm.title || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
              />
            ) : (
              <h2 className="text-lg font-bold text-gray-800">
                {ticket.title || "Untitled"}
              </h2>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  ticket.status === "done"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                Status: {ticket.status || "open"}
              </span>

              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  ticket.paid === "yes"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                Paid: {ticket.paid === "yes" ? "Yes" : "No"}
              </span>

              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  ticket.priority === "high"
                    ? "bg-red-100 text-red-700"
                    : ticket.priority === "medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                Priority: {ticket.priority || "medium"}
              </span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assigned To */}
              <div className="border rounded-xl p-4 bg-white shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                {isEditing ? (
                  <select
                    className="w-full border rounded-lg p-2 bg-gray-50"
                    value={editForm.assignedTo || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, assignedTo: e.target.value })
                    }
                  >
                    <option value="">Select user</option>
                    {users.map((user) => (
                      <option key={user._id} value={user.username}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-medium text-gray-800 break-words">
                    {ticket.assignedTo || "—"}
                  </p>
                )}
              </div>

              <InfoCard label="Created By" value={ticket.createdBy} />

              {/* Company */}
              <div className="border rounded-xl p-4 bg-white shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Company</p>
                {isEditing ? (
                  <Select
                    options={companies.map((c) =>
                      typeof c === "string"
                        ? { value: c, label: c }
                        : { value: c.name || c.companyName, label: c.name || c.companyName }
                    )}
                    value={
                      editForm.company
                        ? { value: editForm.company, label: editForm.company }
                        : null
                    }
                    onChange={(option) =>
                      setEditForm({
                        ...editForm,
                        company: option ? option.value : "",
                      })
                    }
                    placeholder="Select company..."
                    isClearable
                    className="text-sm"
                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-800 break-words">
                    {ticket.company || "—"}
                  </p>
                )}
              </div>

              {/* Rate */}
              <div className="border rounded-xl p-4 bg-white shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Rate</p>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2 bg-gray-50"
                      value={editForm.rate || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, rate: e.target.value })
                      }
                    />
                    <select
                      className="w-full border rounded-lg p-2 bg-gray-50"
                      value={editForm.currency || "IQD"}
                      onChange={(e) =>
                        setEditForm({ ...editForm, currency: e.target.value })
                      }
                    >
                      <option value="USD">USD</option>
                      <option value="IQD">IQD</option>
                    </select>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-gray-800 break-words">
                    {ticket.rate
                      ? `${Number(ticket.rate).toLocaleString()} ${ticket.currency || ""}`
                      : "—"}
                  </p>
                )}
              </div>

              {/* Due Date */}
              <div className="border rounded-xl p-4 bg-white shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Due Date</p>
                {isEditing ? (
                  <input
                    type="date"
                    className="w-full border rounded-lg p-2 bg-gray-50"
                    value={editForm.dueDate || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, dueDate: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-800 break-words">
                    {formatDate(ticket.dueDate)}
                  </p>
                )}
              </div>

              {/* Priority */}
              <div className="border rounded-xl p-4 bg-white shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Priority</p>
                {isEditing ? (
                  <select
                    className="w-full border rounded-lg p-2 bg-gray-50"
                    value={editForm.priority || "medium"}
                    onChange={(e) =>
                      setEditForm({ ...editForm, priority: e.target.value })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                ) : (
                  <p className="text-sm font-medium text-gray-800 break-words">
                    {ticket.priority || "—"}
                  </p>
                )}
              </div>

              <InfoCard label="Done At" value={formatDate(ticket.doneAt)} />
              <InfoCard label="Created At" value={formatDate(ticket.createdAt)} />
              <InfoCard label="Updated At" value={formatDate(ticket.updatedAt)} />
            </div>

            {/* Description */}
            <div className="border rounded-xl p-5 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-500 mb-2">
                Description
              </h3>
              {isEditing ? (
                <textarea
                  className="w-full border rounded-lg p-3 bg-white min-h-[120px]"
                  value={editForm.description || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                />
              ) : (
                <p className="text-gray-800 whitespace-pre-wrap">
                  {ticket.description || "—"}
                </p>
              )}
            </div>

            {/* Paid Section */}
            <div className="border rounded-xl p-5 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Paid</h3>

              {currentUser?.role === "admin" ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => updatePaid("yes")}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      ticket.paid === "yes"
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    Yes
                  </button>

                  <button
                    disabled={ticket.paid === "yes"}
                    onClick={() => updatePaid("no")}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      ticket.paid === "no"
                        ? "bg-red-600 text-white"
                        : ticket.paid === "yes"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    No
                  </button>
                </div>
              ) : (
                <p className="font-medium">
                  {ticket.paid === "yes" ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                      Yes
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                      No
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              {isEditing ? (
                <>
                  <button
                    onClick={saveEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {ticket.status !== "done" &&
                    canMarkDone(currentUser, ticket) && (
                      <button
                        onClick={markAsDone}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Mark as Done
                      </button>
                    )}

                  {currentUser?.role === "admin" && (
                    <button
                      onClick={startEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit
                    </button>
                  )}

                  <button
                    onClick={() => router.push("/tickets")}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800 break-words">
        {value || "—"}
      </p>
    </div>
  );
}