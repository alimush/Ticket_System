"use client";

import { motion } from "framer-motion";

function SkeletonBar({ className = "" }) {
  return (
    <div
      className={`rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] ${className}`}
    />
  );
}

function TicketCardSkeleton({ delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-xl border border-slate-200 border-l-4 border-l-slate-300 bg-white p-4 shadow-sm"
    >
      <div className="flex gap-2 mb-4">
        <SkeletonBar className="h-5 w-16" />
        <SkeletonBar className="h-5 w-14" />
      </div>
      <SkeletonBar className="h-5 w-4/5 mb-2" />
      <SkeletonBar className="h-4 w-3/5 mb-4" />
      <div className="pt-3 border-t border-slate-100 flex justify-between">
        <SkeletonBar className="h-5 w-14 rounded-full" />
        <SkeletonBar className="h-4 w-16" />
      </div>
    </motion.div>
  );
}

function DateGroupSkeleton({ cardCount = 3, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <SkeletonBar className="h-6 w-28" />
        <SkeletonBar className="h-5 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: cardCount }).map((_, i) => (
          <TicketCardSkeleton key={i} delay={delay + i * 0.06} />
        ))}
      </div>
    </motion.div>
  );
}

export default function LoadingSpinner({
  message = "Loading tickets...",
  className = "",
}) {
  return (
    <div
      className={`w-full space-y-10 py-2 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <DateGroupSkeleton cardCount={3} delay={0} />
      <div className="border-t border-slate-200 pt-8">
        <DateGroupSkeleton cardCount={3} delay={0.15} />
      </div>

      <div className="flex items-center justify-center gap-2 pt-2">
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-slate-400"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1, 0.85] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </span>
        <p className="text-xs font-medium text-slate-400 tracking-wide">
          {message}
        </p>
      </div>
    </div>
  );
}
