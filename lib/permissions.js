// lib/permissions.js

// 🟢 جلب المستخدم الحالي من localStorage
export function getCurrentUser() {
    if (typeof window === "undefined") return { username: "guest", role: "user" };
  
    return {
      username: localStorage.getItem("username") || "guest",
      role: localStorage.getItem("role") || "user",
    };
  }
  
  // 🟢 دوال التحقق
  export function isAdmin(user) {
    return user?.role === "admin";
  }
  
  export function canCreateUser(user) {
    return isAdmin(user); // بس الـ admin
  }
  
  export function canDeleteUser(user) {
    return isAdmin(user);
  }
  
  export function canUpdateUser(user) {
    return isAdmin(user);
  }
  
  export function canCreateTicket(user) {
    return isAdmin(user); // ممكن تخليها true للجميع اذا تحب
  }
  
  export function canDeleteTicket(user) {
    return isAdmin(user);
  }
  
  export function isBayanUser(user) {
    return (user?.username || user?.name || "").toLowerCase() === "bayan";
  }

  export function canEditTicket(user, ticket) {
    // admin و bayan يكدرون يعدلون
    if (isAdmin(user) || isBayanUser(user)) return true;
    const userName = user?.username || user?.name || "";
    return ticket?.assignedTo === userName;
  }

  export function canMarkDone(user, ticket) {
    // admin، أو الـ assigned، أو bayan
    if (isBayanUser(user)) return true;
    return isAdmin(user) || ticket.assignedTo === user.username;
  }

  export function canViewRate(user) {
    // bayan ما يشوف أي rate
    return !isBayanUser(user);
  }

  export function canViewPaid(user) {
    // bayan ما يشوف Paid/Unpaid
    return !isBayanUser(user);
  }
  
  export function canViewTicket(user, ticket) {
    // الادمن و bayan يشوفون الكل، الباقي يشوفون تكتاتهم فقط
    if (isAdmin(user) || isBayanUser(user)) return true;
    return (
      ticket.createdBy === user.username ||
      ticket.assignedTo === user.username
    );
  }