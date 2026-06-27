"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaUser, FaLock, FaTasks } from "react-icons/fa";
import { BiSolidReport } from "react-icons/bi";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    try {
      setLoading(true);
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("role", data.user.role);
        window.dispatchEvent(new Event("userChanged"));
        router.push("/create-ticket");
      } else {
        setError(data.error || "Wrong username or password");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="-m-6 min-h-screen flex">
      {/* Brand panel */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-[45%] xl:w-[42%] bg-slate-950 flex-col justify-between p-10 xl:p-14 relative overflow-hidden"
      >
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-slate-800/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-slate-800/30 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <span className="text-slate-950 text-sm font-black tracking-wide">SPC</span>
            </div>
            <div>
              <p className="text-lg font-bold text-white">Ticket System</p>
              <p className="text-xs text-slate-500">Developed by SPC team</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
            Manage tickets,
            <br />
            <span className="text-slate-400">reports & teams.</span>
          </h2>
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
            Sign in to create tickets, track progress, generate reports, and
            manage your workflow in one place.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <FeaturePill icon={FaTasks} label="Tickets" />
            <FeaturePill icon={BiSolidReport} label="Reports" />
          </div>
        </div>

        <p className="relative text-xs text-slate-600">
          © Solution Portal Company
        </p>
      </motion.div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center">
              <span className="text-white text-xs font-black tracking-wide">SPC</span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">Ticket System</p>
              <p className="text-[11px] text-slate-500">Developed by SPC team</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
              <p className="text-sm text-slate-500 mt-1">
                Enter your credentials to continue
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError("");
                    }}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white transition"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white transition"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white text-sm font-semibold py-3 rounded-xl hover:bg-slate-800 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6 lg:hidden">
            © Solution Portal Company
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function FeaturePill({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
      <Icon className="text-slate-500" />
      {label}
    </span>
  );
}
