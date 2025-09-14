"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  // 🟢 Fetch companies
  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error fetching companies:", err);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // 🟢 Add new company
  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to add company");
      return;
    }

    setName("");
    fetchCompanies();
  };

  // 🟡 Update company
  const handleUpdate = async (id) => {
    const res = await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });

    if (res.ok) {
      setEditingId(null);
      setEditName("");
      fetchCompanies();
    } else {
      alert("❌ Failed to update company");
    }
  };

  // 🔴 Delete company
  const handleDelete = async (id) => {
    if (!confirm("هل تريد حذف هذه الشركة؟")) return;

    const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchCompanies();
    } else {
      alert("❌ Failed to delete company");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Companies</h1>
      </div>

      {/* Add Form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter company name"
          className="border rounded-lg px-2 py-1 text-sm flex-1 shadow-sm focus:ring-1 focus:ring-blue-400"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-3 py-1 text-sm rounded-lg hover:bg-blue-700 transition"
        >
          Add
        </button>
      </form>

      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

      {/* Companies List */}
      <ul className="bg-white rounded-lg shadow-md divide-y">
        <AnimatePresence>
          {companies.map((c, index) => (
            <motion.li
              key={c._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
              className="p-3 flex justify-between items-center hover:bg-gray-50 text-sm"
            >
              {editingId === c._id ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border rounded-lg px-2 py-1 text-sm flex-1 shadow-sm focus:ring-1 focus:ring-green-400"
                  />
                  <button
                    onClick={() => handleUpdate(c._id)}
                    className="bg-green-600 text-white px-3 py-1 text-sm rounded-lg hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditName("");
                    }}
                    className="bg-gray-300 text-gray-800 px-3 py-1 text-sm rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-medium text-gray-800">{c.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(c._id);
                        setEditName(c.name);
                      }}
                      className="bg-yellow-500 text-white px-3 py-1 text-sm rounded-lg hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="bg-red-600 text-white px-3 py-1 text-sm rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}