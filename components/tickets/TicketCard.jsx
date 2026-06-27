"use client";

import { motion } from "framer-motion";
import { FaTrash } from "react-icons/fa";
import {
  StatusBadge,
  PriorityBadge,
  PaidBadge,
  getPriorityBorder,
} from "./TicketBadges";

export default function TicketCard({
  ticket,
  onClick,
  onDelete,
  canDelete,
  index = 0,
  hideRate = false,
}) {
  const isDone = ticket.status === "done";
  const dueLabel = ticket.dueDate
    ? new Date(ticket.dueDate).toLocaleDateString("en-CA")
    : null;

  const rateLabel =
    ticket.rate != null && ticket.rate !== ""
      ? hideRate
        ? "*****"
        : `${Number(ticket.rate).toLocaleString()} ${ticket.currency || "IQD"}`
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.05, 0.6),
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      onClick={onClick}
      className={`group relative p-4 rounded-xl border border-l-4 shadow-sm cursor-pointer
        hover:shadow-md hover:-translate-y-0.5 transition-shadow duration-200
        ${getPriorityBorder(ticket.priority)}
        ${
          isDone
            ? "bg-slate-50 border-slate-200 opacity-75"
            : "bg-white border-slate-200"
        }`}
    >
      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(ticket._id);
          }}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all"
          aria-label="Delete ticket"
        >
          <FaTrash className="text-sm" />
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-3 pr-6">
        <PriorityBadge priority={ticket.priority} />
        <PaidBadge paid={ticket.paid} />
      </div>

      <h3
        className={`font-semibold text-base mb-2 line-clamp-2 ${
          isDone ? "text-slate-500 line-through" : "text-slate-800"
        }`}
      >
        {ticket.title}
      </h3>

      <p className="text-xs text-slate-500 mb-1 truncate">
        {[ticket.company, ticket.assignedTo, dueLabel && `Due ${dueLabel}`]
          .filter(Boolean)
          .join(" · ") || "—"}
      </p>

      {rateLabel && (
        <p className="text-sm font-semibold text-slate-700 mb-3">{rateLabel}</p>
      )}

      {!rateLabel && <div className="mb-3" />}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <StatusBadge status={ticket.status} />
        {ticket.doneAt && (
          <span className="text-[11px] text-slate-400">
            {new Date(ticket.doneAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </motion.div>
  );
}
