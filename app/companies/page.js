"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBuilding,
  FaPlus,
  FaPen,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import LoadingSpinner from "@/components/LoadingSpinner";

function HoverAction({ icon: Icon, label, onClick, variant = "default" }) {
  const styles = {
    default: "text-slate-500 hover:text-slate-900 hover:bg-slate-200",
    danger: "text-red-500 hover:text-red-600 hover:bg-red-50",
  };

  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`p-2 rounded-lg transition-all duration-200 ${styles[variant]}`}
    >
      <Icon className="text-sm" />
    </button>
  );
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editModal, setEditModal] = useState(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/companies", { cache: "no-store" });
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching companies:", err);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUser(getCurrentUser());
    }
  }, []);

  useEffect(() => {
    if (currentUser && isAdmin(currentUser)) {
      fetchCompanies();
    }
  }, [currentUser]);

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 2500);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (creating) return;

    try {
      setCreating(true);
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add company");
        return;
      }

      setName("");
      fetchCompanies();
      showSuccess("Company added successfully");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editModal || saving) return;

    const trimmed = editModal.name.trim();
    if (!trimmed) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/companies/${editModal._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      const data = await res.json();

      if (res.ok) {
        setEditModal(null);
        fetchCompanies();
        showSuccess("Company updated successfully");
      } else {
        alert(data.error || "Failed to update company");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("هل تريد حذف هذه الشركة؟")) return;

    const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (res.ok) {
      setEditModal(null);
      fetchCompanies();
      showSuccess("Company deleted");
    } else {
      alert(data.error || "Failed to delete company");
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm min-h-[320px] flex items-center justify-center">
          <LoadingSpinner message="Loading companies..." />
        </div>
      </div>
    );
  }

  if (!isAdmin(currentUser)) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-16 text-center shadow-sm">
          <p className="text-lg font-semibold text-red-700">Access Denied</p>
          <p className="text-sm text-red-500 mt-1">Admins only</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Companies</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {companies.length} registered compan{companies.length !== 1 ? "ies" : "y"}
          </p>
        </div>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm max-w-xs"
      >
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Total Companies
        </p>
        <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
          {companies.length}
        </p>
      </motion.div>

      {/* Add company */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4"
      >
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <FaBuilding className="text-slate-400" />
          Add New Company
        </h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Company name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter company name"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-slate-800 transition shadow-sm disabled:opacity-60 whitespace-nowrap"
            >
              <FaPlus className="text-xs" />
              {creating ? "Adding..." : "Add Company"}
            </button>
          </div>
        </form>
        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}
      </motion.div>

      {/* Search */}
      <div className="relative max-w-md">
        <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm min-h-[280px] flex items-center justify-center">
          <LoadingSpinner message="Loading companies..." />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <p className="text-slate-600 font-medium">
            {search ? "No companies match your search" : "No companies yet"}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-3 text-sm text-slate-500 hover:text-slate-800 underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-950 text-slate-300 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3.5 text-left font-semibold">#</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Company Name</th>
                  <th className="px-4 py-3.5 text-center font-semibold w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCompanies.map((c, idx) => (
                  <tr
                    key={c._id}
                    onClick={() => setEditModal({ _id: c._id, name: c.name })}
                    className="group cursor-pointer even:bg-slate-50/50 hover:bg-slate-100/90 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-400 tabular-nums w-12">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 group-hover:text-slate-950">
                      {c.name}
                    </td>
                    <td
                      className="px-2 py-3 align-middle w-28 min-w-[112px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-0.5 h-8">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto">
                          <HoverAction
                            icon={FaPen}
                            label="Edit company"
                            onClick={() => setEditModal({ _id: c._id, name: c.name })}
                          />
                          <HoverAction
                            icon={FaTrash}
                            label="Delete company"
                            variant="danger"
                            onClick={() => handleDelete(c._id)}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Edit modal */}
      <AnimatePresence>
        {editModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setEditModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-950">
                <div>
                  <FaBuilding className="text-slate-400 mb-1" />
                  <h2 className="text-lg font-semibold text-white">Edit Company</h2>
                </div>
                <button
                  onClick={() => setEditModal(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-6">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Company name
                </label>
                <input
                  type="text"
                  value={editModal.name}
                  onChange={(e) =>
                    setEditModal({ ...editModal, name: e.target.value })
                  }
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
                  autoFocus
                />
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleDelete(editModal._id)}
                  className="px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Delete
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditModal(null)}
                    className="px-4 py-2 text-xs font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={saving || !editModal.name.trim()}
                    className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
