"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaPlus, FaPen, FaTrash, FaUserPlus, FaTimes } from "react-icons/fa";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import LoadingSpinner from "@/components/LoadingSpinner";

function RoleBadge({ role }) {
  const isAdminRole = role === "admin";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
        isAdminRole
          ? "bg-violet-100 text-violet-800 border-violet-200"
          : "bg-slate-100 text-slate-600 border-slate-200"
      }`}
    >
      {role || "user"}
    </span>
  );
}

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

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async (query = "") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
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
      fetchUsers();
    }
  }, [currentUser]);

  const adminCount = useMemo(
    () => users.filter((u) => u.role === "admin").length,
    [users]
  );
  const userCount = users.length - adminCount;

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 2500);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (creating) return;

    try {
      setCreating(true);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });

      if (res.ok) {
        setUsername("");
        setPassword("");
        setRole("user");
        fetchUsers(search);
        showSuccess("User created successfully");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to register user");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser || saving) return;

    try {
      setSaving(true);
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser._id,
          username: selectedUser.username,
          password: selectedUser.password,
          role: selectedUser.role,
        }),
      });

      if (res.ok) {
        fetchUsers(search);
        showSuccess("User updated successfully");
        setIsModalOpen(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update user");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("هل تريد حذف هذا المستخدم؟")) return;

    await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    fetchUsers(search);
    setIsModalOpen(false);
    showSuccess("User deleted");
  };

  const openEdit = (user) => {
    setSelectedUser({ ...user });
    setIsModalOpen(true);
  };

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm min-h-[320px] flex items-center justify-center">
          <LoadingSpinner message="Loading users..." />
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
          <h1 className="text-2xl font-bold text-slate-800">Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {users.length} registered user{users.length !== 1 ? "s" : ""}
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Users" value={users.length.toString()} index={0} />
        <StatCard label="Admins" value={adminCount.toString()} index={1} />
        <StatCard label="Regular Users" value={userCount.toString()} index={2} />
      </div>

      {/* Add user form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4"
      >
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <FaUserPlus className="text-slate-400" />
          Add New User
        </h2>
        <form
          onSubmit={handleRegister}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating}
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-slate-800 transition shadow-sm disabled:opacity-60"
            >
              <FaPlus className="text-xs" />
              {creating ? "Adding..." : "Add User"}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-md">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
        <input
          type="text"
          placeholder="Search by username..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            fetchUsers(e.target.value);
          }}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm min-h-[280px] flex items-center justify-center">
          <LoadingSpinner message="Loading users..." />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <p className="text-slate-600 font-medium">No users found</p>
          {search && (
            <button
              onClick={() => {
                setSearch("");
                fetchUsers("");
              }}
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
                  <th className="px-4 py-3.5 text-left font-semibold">Username</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Role</th>
                  <th className="px-4 py-3.5 text-center font-semibold w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr
                    key={u._id}
                    onClick={() => openEdit(u)}
                    className="group cursor-pointer even:bg-slate-50/50 hover:bg-slate-100/90 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800 group-hover:text-slate-950">
                      {u.username}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td
                      className="px-2 py-3 align-middle w-28 min-w-[112px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-0.5 h-8">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto">
                          <HoverAction
                            icon={FaPen}
                            label="Edit user"
                            onClick={() => openEdit(u)}
                          />
                          <HoverAction
                            icon={FaTrash}
                            label="Delete user"
                            variant="danger"
                            onClick={() => handleDelete(u._id)}
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
        {isModalOpen && selectedUser && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
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
                  <RoleBadge role={selectedUser.role} />
                  <h2 className="text-lg font-semibold text-white mt-2">
                    Edit User
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={selectedUser.username}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, username: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Password
                  </label>
                  <input
                    type="text"
                    value={selectedUser.password}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, password: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Role
                  </label>
                  <select
                    value={selectedUser.role}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, role: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleDelete(selectedUser._id)}
                  className="px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Delete
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={saving}
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

function StatCard({ label, value, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
    </motion.div>
  );
}
