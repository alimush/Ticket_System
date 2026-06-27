"use client";

import { useState, useEffect } from "react";
import {
  FaUserCircle,
  FaBars,
  FaTimes,
  FaUserPlus,
  FaSignOutAlt,
  FaTasks,
  FaBuilding,
} from "react-icons/fa";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BiSolidReport } from "react-icons/bi";

const NAV_ITEMS = [
  { href: "/create-ticket", label: "Tickets", icon: FaTasks },
  { href: "/reports", label: "Reports", icon: BiSolidReport },
];

const ADMIN_ITEMS = [
  { href: "/register", label: "Users", icon: FaUserPlus },
  { href: "/companies", label: "Companies", icon: FaBuilding },
];

export default function Header({ onLogout }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null);

  const isLogin = pathname === "/login";
  const isAdmin = role === "admin";

  useEffect(() => {
    const updateUser = () => {
      const storedUser = localStorage.getItem("username");
      const storedRole = localStorage.getItem("role");
      setUsername(storedUser || null);
      setRole(storedRole || "user");
      if (!storedUser) setSidebarOpen(false);
    };
    updateUser();
    window.addEventListener("userChanged", updateUser);
    return () => window.removeEventListener("userChanged", updateUser);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    setUsername(null);
    setRole(null);
    setSidebarOpen(false);
    window.dispatchEvent(new Event("userChanged"));
    if (onLogout) onLogout();
    router.push("/login");
  };

  const navigate = (href) => {
    setSidebarOpen(false);
    router.push(href);
  };

  const isActive = (href) => {
    if (href === "/create-ticket") {
      return pathname === "/create-ticket" || pathname.startsWith("/tickets");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  if (isLogin) return null;

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-slate-950 border-b border-slate-800 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: logo */}
            <button
              onClick={() => navigate("/create-ticket")}
              className="flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-slate-100 transition">
                <span className="text-slate-950 text-xs font-black tracking-wide">SPC</span>
              </div>
              <div className="leading-tight text-left">
                <p className="text-sm font-bold text-white">Ticket System</p>
                <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                  Developed by SPC team
                </p>
              </div>
            </button>

            {/* Right: user + burger */}
            {username && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                  <FaUserCircle className="text-slate-400 text-xl shrink-0" />
                  <div className="leading-tight text-left hidden sm:block">
                    <p className="text-sm font-semibold text-slate-100 max-w-[140px] truncate">
                      {username}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">{role}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600 transition"
                  aria-label="Open menu"
                >
                  <FaBars className="text-lg" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Overlay + Side Drawer */}
      <AnimatePresence>
        {sidebarOpen && username && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed top-0 right-0 z-50 h-full w-72 max-w-[85vw] bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                    <span className="text-slate-950 text-xs font-black">SPC</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Menu</p>
                    <p className="text-xs text-slate-500">Navigation</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  aria-label="Close menu"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>

              {/* User info */}
              <div className="px-5 py-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <FaUserCircle className="text-slate-400 text-2xl shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{username}</p>
                    <p className="text-xs text-slate-500 capitalize">{role}</p>
                  </div>
                </div>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  Main
                </p>
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                  <SidebarItem
                    key={href}
                    active={isActive(href)}
                    onClick={() => navigate(href)}
                    icon={<Icon />}
                    label={label}
                  />
                ))}

                {isAdmin && (
                  <>
                    <p className="px-3 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                      Admin
                    </p>
                    {ADMIN_ITEMS.map(({ href, label, icon: Icon }) => (
                      <SidebarItem
                        key={href}
                        active={isActive(href)}
                        onClick={() => navigate(href)}
                        icon={<Icon />}
                        label={label}
                      />
                    ))}
                  </>
                )}
              </nav>

              {/* Logout */}
              <div className="p-4 border-t border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 bg-red-950/30 border border-red-900/40 hover:bg-red-950/50 transition"
                >
                  <FaSignOutAlt className="text-base" />
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarItem({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
        active
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-400 hover:text-white hover:bg-slate-900"
      }`}
    >
      <span className={`text-base ${active ? "text-slate-700" : "text-slate-500"}`}>
        {icon}
      </span>
      {label}
    </button>
  );
}
