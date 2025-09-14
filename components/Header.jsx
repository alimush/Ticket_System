"use client";
import { useState, useEffect } from "react";
import { FaUserCircle, FaBars, FaHome, FaUserPlus, FaSignOutAlt } from "react-icons/fa";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Poppins } from "next/font/google";
import { MdPolicy } from "react-icons/md";
import { BiSolidReport } from "react-icons/bi";
import { FaTasks } from "react-icons/fa";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export default function Header({ onLogout }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null); // 🟢 role state

  useEffect(() => {
    const updateUser = () => {
      const storedUser = localStorage.getItem("username");
      const storedRole = localStorage.getItem("role"); // 🟢 get role
      setUsername(storedUser || null);
      setRole(storedRole || "user"); // default user
      if (!storedUser) setMenuOpen(false);
    };
    updateUser();
    window.addEventListener("userChanged", updateUser);
    return () => window.removeEventListener("userChanged", updateUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("role"); // 🟢 clear role
    setUsername(null);
    setRole(null);
    window.dispatchEvent(new Event("userChanged"));
    if (onLogout) onLogout();
    router.push("/login");
  };

  return (
    <motion.header
      initial={{ y: "-100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "-100%", opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="sticky top-0 z-50 w-full
                 backdrop-blur-xl border-b border-gray-800/60
                 bg-gradient-to-b from-gray-800 via-gray-750 to-gray-900
                 shadow-[0_4px_24px_rgba(0,0,0,0.7)]"
    >
      <div className="relative max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
        {/* يسار */}
        <div className="relative flex flex-col items-start leading-tight">
          <span
            className={`font-bold text-2xl tracking-tight
                        bg-gradient-to-r from-gray-300 via-gray-100 to-white
                        text-transparent bg-clip-text ${poppins.className}`}
          >
            SPC
          </span>
          <span className={`text-[11px] text-gray-300 ${poppins.className}`}>
            Developed by SPC team
          </span>
          <span className="absolute -bottom-2 left-0 h-[2px] w-16 rounded-full
                           bg-gradient-to-r from-gray-500 via-gray-400 to-gray-300 opacity-80" />
        </div>

        {/* الوسط */}
        <h1
          className="absolute left-1/2 -translate-x-1/2 
                     text-base sm:text-lg md:text-2xl font-bold tracking-tight
                     bg-gradient-to-r from-gray-200 via-gray-100 to-white
                     text-transparent bg-clip-text"
        >
          Ticket System
        </h1>

        {/* يمين */}
        <AnimatePresence>
          {pathname !== "/login" && (
            <motion.div
              key="right-side"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="relative flex items-center"
            >
              <AnimatePresence mode="wait">
                {username && (
                  <motion.div
                    key="user-cluster"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="flex items-center gap-3"
                  >
                    {/* بطاقة اليوزر */}
                    <motion.div
                      whileHover={{ scale: 1.04 }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                                 bg-gray-800/80 border border-gray-600 shadow-sm"
                    >
                      <FaUserCircle className="text-gray-200 text-2xl" />
                      <span className="text-sm font-medium text-gray-100">
                        {username}
                      </span>
                    </motion.div>

                    {/* زر المنيو */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setMenuOpen((v) => !v)}
                      className={`p-2 rounded-xl border transition 
                        ${menuOpen
                          ? "bg-gray-700 border-gray-500"
                          : "bg-gray-800 hover:bg-gray-700 border-gray-600"}`}
                      aria-label="menu"
                    >
                      <motion.div animate={{ rotate: menuOpen ? 90 : 0 }} transition={{ duration: 0.35 }}>
                        <FaBars className="text-gray-200 text-lg" />
                      </motion.div>
                    </motion.button>

                    {/* المنيو */}
                    <AnimatePresence>
                      {menuOpen && (
                        <motion.div
                          key="menu"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.35, ease: "easeInOut" }}
                          className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl
                                     border border-gray-600 bg-gray-800 shadow-xl"
                        >
                          <div className="p-1">
                            <MenuItem
                              onClick={() => {
                                setMenuOpen(false);
                                router.push("/create-ticket");
                              }}
                              icon={<FaTasks className="text-gray-200" />}
                              label="Ceate Ticket"
                            />
                            {/* 🟢 يظهر بس إذا كان admin */}
                            {role === "admin" && (
                              <MenuItem
                                onClick={() => {
                                  setMenuOpen(false);
                                  router.push("/register");
                                }}
                                icon={<FaUserPlus className="text-gray-200" />}
                                label="Create User"
                              />
                              
                            )}
                             {role === "admin" && (
                              <MenuItem
                                onClick={() => {
                                  setMenuOpen(false);
                                  router.push("/companies");
                                }}
                                icon={<FaUserPlus className="text-gray-200" />}
                                label="companies"
                              />
                              
                            )}
                             {role === "admin" && (
                              <MenuItem
                                onClick={() => {
                                  setMenuOpen(false);
                                  router.push("/reports");
                                }}
                                icon={<BiSolidReport className="text-gray-200" />}
                                label="Reports"
                              />
                              
                            )}
                            {/* {role === "admin" && (
                              <MenuItem
                                onClick={() => {
                                  setMenuOpen(false);
                                  router.push("/permissions");
                                }}
                                icon={<MdPolicy className="text-gray-200" />}
                                label="إدارة الصلاحيات"
                              />
                            )} */}
                            <MenuItem
                              onClick={handleLogout}
                              icon={<FaSignOutAlt className="text-red-400" />}
                              label="Logout"
                              danger
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}

function MenuItem({ onClick, icon, label, danger = false }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition
        ${danger ? "text-red-400 hover:bg-red-900/40" : "text-gray-200 hover:bg-gray-700"}`}
    >
      <span className="text-base">{icon}</span>
      <span className="font-medium">{label}</span>
    </motion.button>
  );
}