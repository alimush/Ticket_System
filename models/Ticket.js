// models/Ticket.js
import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    assignedTo: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["open", "in_progress", "done"],
      default: "open",
    },
    createdBy: { type: String, required: true },
    company: String,
    paid: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },
    // 🟢 التاريخ الجديد
    doneAt: { type: Date, default: null },
  },
  { collection: "tickets", timestamps: true }
);

export default mongoose.models.Ticket ||
  mongoose.model("Ticket", TicketSchema);