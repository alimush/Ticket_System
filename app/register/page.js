"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentUser, canCreateUser, canDeleteUser } from "@/lib/permissions";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // 🟢 new state
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // 🟢 fetch users
  const fetchUsers = async (query = "") => {
    try {
      const res = await fetch(`/api/users?q=${query}`);
      const data = await res.json();
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ➕ create user
  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }), // 🟢 send role
    });

    if (res.ok) {
      setUsername("");
      setPassword("");
      setRole("user");
      fetchUsers(search);
      setSuccessMsg("✅ User created successfully!");
      setTimeout(() => setSuccessMsg(""), 2000);
    } else {
      const data = await res.json();
      alert(data.error || "❌ Failed to register user");
    }
  };

  // ✏️ update user
  const handleEdit = async () => {
    if (!selectedUser) return;

    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedUser._id,
        username: selectedUser.username,
        password: selectedUser.password,
        role: selectedUser.role, // 🟢 update role
      }),
    });

    if (res.ok) {
      fetchUsers(search);
      setSuccessMsg("✅ User updated successfully!");
      setTimeout(() => setSuccessMsg(""), 2000);
      setIsModalOpen(false);
    } else {
      const data = await res.json();
      alert(data.error || "❌ Failed to update user");
    }
  };
  useEffect(() => {
    if (typeof window !== "undefined") {
      const username = localStorage.getItem("username");
      const role = localStorage.getItem("role") || "user";
      setCurrentUser({ username, role });
    }
  }, []);
  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetchUsers();
    }
  }, [currentUser]);
  if (!currentUser) {
    return <p className="text-center mt-20">⏳ Loading...</p>;
  }
  
  if (currentUser.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h1 className="text-xl font-bold text-red-600">
          🚫 Access Denied – Admins Only
        </h1>
      </div>
    );
  }

  // 🗑 delete user
  const handleDelete = async (id) => {
    if (!confirm("هل تريد حذف هذا المستخدم؟")) return;
    await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    fetchUsers(search);
    setIsModalOpen(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center 
                    bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 relative overflow-hidden">
      <motion.div
        className="relative bg-white/70 shadow-xl rounded-2xl p-8 w-full max-w-md 
                   text-gray-800 backdrop-blur-xl border border-gray-200/60"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className="text-2xl font-bold text-center 
                       bg-gradient-to-r from-gray-600 via-slate-700 to-gray-900 
                       text-transparent bg-clip-text mb-6">
          Users Management
        </h1>

        {/* 🔍 search */}
        <input
          type="text"
          placeholder="🔍 Search by username"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            fetchUsers(e.target.value);
          }}
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 
                     outline-none focus:ring-2 focus:ring-gray-400 bg-white/70"
        />

        {/* ➕ add user */}
        <form onSubmit={handleRegister} className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 
                       outline-none focus:ring-2 focus:ring-gray-400 bg-white/70"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 
                       outline-none focus:ring-2 focus:ring-gray-400 bg-white/70"
            required
          />
          {/* 🟢 select role */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 
                       outline-none focus:ring-2 focus:ring-gray-400 bg-white/70"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <motion.button
            type="submit"
            className="w-full bg-gradient-to-r from-gray-500 via-slate-600 to-gray-800 
                       text-white font-bold p-3 rounded-lg shadow-lg 
                       hover:from-gray-600 hover:to-gray-900 transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Add User
          </motion.button>
        </form>

        {/* ✅ success message */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              className="mb-4 text-green-600 font-medium text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 📋 users list */}
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Registered Users
        </h2>
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {users.length > 0 ? (
            users.map((u) => (
              <li
                key={u._id}
                className="flex justify-between items-center p-3 
                           bg-white/60 rounded-lg border border-gray-200 
                           text-sm text-gray-700 backdrop-blur-sm"
              >
                <span className="font-medium">
                  {u.username}{" "}
                  <span className="text-xs text-gray-500">({u.role})</span>
                </span>
                <motion.button
                  onClick={() => {
                    setSelectedUser(u);
                    setIsModalOpen(true);
                  }}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Details
                </motion.button>
              </li>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No users found.</p>
          )}
        </ul>
      </motion.div>

      {/* 🟢 edit modal */}
      <AnimatePresence>
        {isModalOpen && selectedUser && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/90 rounded-xl shadow-xl p-6 w-96 
                         border border-gray-200 backdrop-blur-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-bold mb-4">Edit User</h2>
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  value={selectedUser.username}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, username: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
                <input
                  type="text"
                  value={selectedUser.password}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, password: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
                {/* 🟢 edit role */}
                <select
                  value={selectedUser.role}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, role: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <motion.button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  whileHover={{ scale: 1.05 }}
                >
                  Save
                </motion.button>
                <motion.button
                  onClick={() => handleDelete(selectedUser._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  whileHover={{ scale: 1.05 }}
                >
                  Delete
                </motion.button>
                <motion.button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}