"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTrash } from "react-icons/fa";
import {
  getCurrentUser,
  canCreateTicket,
  canDeleteTicket,
  canMarkDone,
  canViewTicket,
} from "@/lib/permissions";
import Select from "react-select";

export default function CreateTicketPage() {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [companies, setCompanies] = useState([]);   // قائمة الشركات
const [company, setCompany] = useState("");       // الشركة المختارة
const [paid, setPaid] = useState(false);
const [status, setStatus] = useState("open");
const [doneAt, setDoneAt] = useState(null);
const [rate, setRate] = useState(""); // 🟢 بالبداية فارغ
const [currency, setCurrency] = useState("IQD");
const [isEditing, setIsEditing] = useState(false);
const [editForm, setEditForm] = useState({});

  // 🟢 current user (from permissions.js)
  const [currentUser, setCurrentUser] = useState(null);
  

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUser(getCurrentUser());
    }
  }, []);
  useEffect(() => {
    if (status === "done") {
      setDoneAt(new Date().toISOString());
    } else {
      setDoneAt(null);
    }
  }, [status]);
  // form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  // fetch tickets
  const fetchTickets = async () => {
    const res = await fetch("/api/tickets");
    const data = await res.json();

    let allTickets = Array.isArray(data) ? data : [];

    // 🟢 filter using canViewTicket
    allTickets = allTickets.filter((t) => canViewTicket(currentUser, t));

    setTickets(allTickets);
  };
  

  // fetch users
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      setUsers([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
    
      // 🟢 tickets
      const resTickets = await fetch("/api/tickets");
      const ticketsData = await resTickets.json();
      let allTickets = Array.isArray(ticketsData) ? ticketsData : [];
      allTickets = allTickets.filter((t) => canViewTicket(currentUser, t));
      setTickets(allTickets);
    
      // 🟢 users
      const resUsers = await fetch("/api/users");
      const usersData = await resUsers.json();
      setUsers(Array.isArray(usersData.users) ? usersData.users : []);
    
      // 🟢 companies
      const resCompanies = await fetch("/api/companies");
      const companiesData = await resCompanies.json();
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
    };
  
    loadData();
  }, [currentUser]);
  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error fetching companies:", err);
      setCompanies([]);
      
    }
  };
  const handleUpdate = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/tickets/${selectedTicket._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        rate: editForm.rate ? Number(editForm.rate.replace(/,/g, "")) : null,
      }),
    });
  
    if (res.ok) {
      const updated = await res.json();
      setTickets((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t))
      );
      setSelectedTicket(null);
      setIsEditing(false);
    }
  };

  // create ticket
  const handleCreate = async (e) => {
    e.preventDefault();
    const createdBy = currentUser.username;
    
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        assignedTo,
        priority,
        dueDate,
        createdBy,
        company,
        paid: "no", // default
        doneAt,
        rate: rate ? Number(rate.replace(/,/g, "")) : null, // ✅ الرقم
        currency,
      }),
    });

    if (res.ok) {
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setPriority("medium");
      setDueDate("");
      fetchTickets();
    }
  };

  // mark as done
  const markAsDone = async (id) => {
    await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    fetchTickets();
  };

  // delete ticket
  const deleteTicket = async (id) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    await fetch(`/api/tickets/${id}`, { method: "DELETE" });
    fetchTickets();
  };

  // animations
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const card = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  // group tickets by due date
  const groupedTickets = tickets.reduce((acc, ticket) => {
    const date = ticket.dueDate ? ticket.dueDate.slice(0, 10) : "No Date";
    if (!acc[date]) acc[date] = [];
    acc[date].push(ticket);
    return acc;
  }, {});

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tickets</h1>
        
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-800 text-white font-medium px-6 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            + Create Ticket
          </button>

      </div>
      

      {/* Tickets grouped by date */}
      <div className="space-y-10">
        {Object.entries(groupedTickets).map(([date, group], idx) => (
          <div
            key={date}
            className={`pt-6 ${idx > 0 ? "border-t border-gray-300" : ""}`}
          >
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              {date}
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                {group.length} tickets
              </span>
            </h2>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {group.map((ticket) => (
           <motion.div
           key={ticket._id}
           variants={card}
           exit={{ opacity: 0, scale: 0.9 }}
           onClick={() => setSelectedTicket(ticket)}
           className={`p-5 rounded-xl border shadow-md transition hover:shadow-xl cursor-pointer relative
             ${
               ticket.status === "done"
                 ? "bg-gray-100 text-gray-400 border-gray-200"
                 : "bg-white text-gray-800 border-gray-300"
             }`}
         >
           {/* زر الحذف */}
           {canDeleteTicket(currentUser) && (
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 deleteTicket(ticket._id);
               }}
               className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
             >
               <FaTrash />
             </button>
           )}
         
           {/* العنوان */}
           <h2 className="font-bold text-lg mb-2">{ticket.title}</h2>
         
           {/* معلومات */}
           <p className="text-sm font-bold">
             Assigned To:{" "}
             <span className="font-normal text-gray-700">{ticket.assignedTo}</span>
           </p>
           <p className="text-sm font-bold">
             Company:{" "}
             <span className="font-normal text-gray-600">{ticket.company || "—"}</span>
           </p>
         
           {/* Paid Badge */}
           <div className="mt-2">
             <span className="text-sm font-bold">Paid: </span>
             <span
               className={`px-2 py-1 rounded-full text-xs font-semibold ${
                 ticket.paid === "yes"
                   ? "bg-green-100 text-green-700"
                   : "bg-red-100 text-red-700"
               }`}
             >
               {ticket.paid === "yes" ? "Yes" : "No"}
             </span>
           </div>
         
           {/* Status Badge */}
           <div className="mt-2">
             <span className="text-sm font-bold">Status: </span>
             <span
               className={`px-2 py-1 rounded-full text-xs font-semibold ${
                 ticket.status === "done"
                   ? "bg-green-100 text-green-700"
                   : ticket.status === "open"
                   ? "bg-yellow-100 text-yellow-700"
                   : "bg-yellow-100 text-yellow-700"
               }`}
             >
               {ticket.status}
             </span>
           </div>
         
           {/* Done At */}
           <p className="text-xs mt-3 font-bold">
             Done At:{" "}
             <span className="font-normal text-gray-500">
               {ticket.doneAt ? new Date(ticket.doneAt).toLocaleDateString() : "—"}
             </span>
           </p>
         </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center   p-4">
         <motion.div
  initial={{ y: 40, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: 40, opacity: 0 }}
  transition={{ duration: 0.3 }}
  className="bg-white rounded-2xl shadow-2xl w-full mt-24 max-w-lg max-h-[80vh] overflow-y-auto"
>
            <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 px-6 py-3">
              <h2 className="text-lg font-semibold text-white">
                Create New Ticket
              </h2>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2 bg-gray-50 border-gray-300 text-gray-900"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full border rounded-lg p-2 bg-gray-50 border-gray-300 text-gray-900"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Assigned To</label>
                <select
                  className="w-full border rounded-lg p-2 bg-gray-50 border-gray-300 text-gray-900"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  required
                >
                  <option value="">Select user</option>
                  {users.map((user) => (
                    <option key={user._id} value={user.username}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
  <label className="block text-gray-700 mb-1">Rate</label>
  <input
  type="text"
  className="w-full border rounded-lg p-2 bg-gray-50 border-gray-300 text-gray-900"
  value={rate}
  onChange={(e) => {
    const rawValue = e.target.value.replace(/,/g, ""); // نشيل الفواصل
    if (rawValue === "") {
      setRate(""); // فارغ
    } else if (!isNaN(rawValue)) {
      setRate(Number(rawValue).toLocaleString()); // نضيف commas
    }
  }}
  placeholder="Enter amount..."
/>
</div>
             
  <div>
    <label className="block text-gray-700 mb-1">Currency</label>
    <select
      className="w-full border rounded-lg p-2 bg-gray-50 border-gray-300 text-gray-900"
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
    >
      <option value="USD">USD</option>
      <option value="IQD">IQD</option>

    </select>
  </div>
<div>
  <label className="block text-gray-700 mb-1">Company</label>
  <Select
  options={companies.map((c) =>
    typeof c === "string"
      ? { value: c, label: c }
      : { value: c.name || c.companyName, label: c.name || c.companyName }
  )}
  value={company ? { value: company, label: company } : null}
  onChange={(option) => {
    console.log("Selected company:", option);
    setCompany(option ? option.value : "");
  }}
  placeholder="Select company..."
  isClearable
  className="text-sm"
  menuPlacement="auto"
  menuPortalTarget={typeof window !== "undefined" ? document.body : null}
  styles={{
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menuList: (base) => ({
      ...base,
      maxHeight: 120,
      overflowY: "auto",
    }),
  }}
/>
</div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">Priority</label>
                  <select
                    className="w-full border rounded-lg p-2 bg-gray-50 border-gray-300 text-gray-900"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full border rounded-lg p-2 bg-gray-50 border-gray-300 text-gray-900"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Ticket Details */}
      {selectedTicket && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center mt-12 p-4">
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 px-6 py-3 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Ticket Details</h2>
        <button
          onClick={() => {
            setIsEditing(false); // ✅ نرجع للوضع العادي
            setSelectedTicket(null);
          }}
          className="text-gray-300 hover:text-white transition"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-6 text-sm text-gray-800 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Title */}
          <div className="border rounded-lg p-3">
            <h3 className="text-xs text-gray-500">Title</h3>
            {isEditing ? (
              <input
                type="text"
                className="w-full border rounded p-1"
                value={editForm.title || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
              />
            ) : (
              <p className="font-medium">{selectedTicket.title}</p>
            )}
          </div>

          {/* Assigned To */}
          <div className="border rounded-lg p-3">
            <h3 className="text-xs text-gray-500">Assigned To</h3>
            {isEditing ? (
              <input
                type="text"
                className="w-full border rounded p-1"
                value={editForm.assignedTo || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, assignedTo: e.target.value })
                }
              />
            ) : (
              <p className="font-medium">{selectedTicket.assignedTo}</p>
            )}
          </div>

          {/* Priority */}
          <div className="border rounded-lg p-3">
            <h3 className="text-xs text-gray-500">Priority</h3>
            {isEditing ? (
              <select
                className="w-full border rounded p-1"
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
              <p className="font-medium">{selectedTicket.priority}</p>
            )}
          </div>

          {/* Due Date */}
          <div className="border rounded-lg p-3">
            <h3 className="text-xs text-gray-500">Due Date</h3>
            {isEditing ? (
              <input
                type="date"
                className="w-full border rounded p-1"
                value={editForm.dueDate || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, dueDate: e.target.value })
                }
              />
            ) : (
              <p className="font-medium">
                {selectedTicket.dueDate?.slice(0, 10) || "—"}
              </p>
            )}
          </div>

          {/* Company */}
          <div className="border rounded-lg p-3">
            <h3 className="text-xs text-gray-500">Company</h3>
            {isEditing ? (
              <input
                type="text"
                className="w-full border rounded p-1"
                value={editForm.company || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, company: e.target.value })
                }
              />
            ) : (
              <p className="font-medium">{selectedTicket.company || "—"}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="border rounded-lg p-3">
          <h3 className="text-xs text-gray-500">Description</h3>
          {isEditing ? (
            <textarea
              className="w-full border rounded p-1"
              value={editForm.description || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
            />
          ) : (
            <p className="font-medium">{selectedTicket.description}</p>
          )}
        </div>

        {/* Rate */}
        <div className="border rounded-lg p-3">
          <h3 className="text-xs text-gray-500">Rate</h3>
          {isEditing ? (
            <input
              type="text"
              className="w-full border rounded p-1"
              value={editForm.rate || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, rate: e.target.value })
              }
            />
          ) : (
            <p className="font-medium">
              {selectedTicket.rate
                ? `${selectedTicket.rate.toLocaleString()} ${
                    selectedTicket.currency || ""
                  }`
                : "—"}
            </p>
          )}
        </div>

        {/* Done At */}
        {selectedTicket.status === "done" && (
          <div className="border rounded-lg p-3 col-span-2">
            <h3 className="text-xs text-gray-500">Done At</h3>
            <p className="font-medium text-green-700">
              {selectedTicket.doneAt
                ? new Date(selectedTicket.doneAt).toLocaleString()
                : "—"}
            </p>
          </div>
        )}
      </div>

    {/* Paid Section */}
<div className="border rounded-lg p-3">
  <h3 className="text-xs text-gray-500 mb-2">Paid</h3>
  {currentUser?.role === "admin" ? (
    <div className="flex gap-3">
      {/* ✅ زر Yes */}
      <button
        onClick={async () => {
          const res = await fetch(`/api/tickets/${selectedTicket._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paid: "yes" }),
          });
          if (res.ok) {
            const updated = await res.json();
            setSelectedTicket(updated);
            setTickets((prev) =>
              prev.map((t) => (t._id === updated._id ? updated : t))
            );
          }
        }}
        className={`px-4 py-2 rounded-lg font-medium transition ${
          selectedTicket.paid === "yes"
            ? "bg-green-600 text-white"
            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
        }`}
      >
        Yes
      </button>

      {/* 🔴 زر No — يتعطل بعد ما تصير Yes */}
      <button
        disabled={selectedTicket.paid === "yes"} // ⛔ يمنع الرجوع بعد Yes
        onClick={async () => {
          const res = await fetch(`/api/tickets/${selectedTicket._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paid: "no" }),
          });
          if (res.ok) {
            const updated = await res.json();
            setSelectedTicket(updated);
            setTickets((prev) =>
              prev.map((t) => (t._id === updated._id ? updated : t))
            );
          }
        }}
        className={`px-4 py-2 rounded-lg font-medium transition ${
          selectedTicket.paid === "no"
            ? "bg-red-600 text-white"
            : selectedTicket.paid === "yes"
            ? "bg-gray-300 text-gray-500 cursor-not-allowed" // 🔒 شكل معطل
            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
        }`}
      >
        No
      </button>
    </div>
  ) : (
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
  )}
</div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-2 px-6 py-3 border-t bg-gray-50">
        {isEditing ? (
          <>
            <button
              onClick={async () => {
                const res = await fetch(`/api/tickets/${selectedTicket._id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(editForm),
                });
                if (res.ok) {
                  const updated = await res.json();
                  setSelectedTicket(updated);
                  setTickets((prev) =>
                    prev.map((t) => (t._id === updated._id ? updated : t))
                  );
                  setIsEditing(false); // ✅ نرجع عرض
                }
              }}
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
            {selectedTicket.status !== "done" &&
              canMarkDone(currentUser, selectedTicket) && (
                <button
                  onClick={() => {
                    markAsDone(selectedTicket._id);
                    setSelectedTicket(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
        rate: selectedTicket.rate ? selectedTicket.rate.toString() : "",
        currency: selectedTicket.currency || "IQD",
      });
      setIsEditing(true);
    }}
    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
  >
    Edit
  </button>
)}
            <button
              onClick={() => {
                setIsEditing(false); // ✅ إذا كان بوضع Edit نرجع عادي
                setSelectedTicket(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
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
