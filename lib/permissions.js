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

  function userNameOf(user) {
    return (user?.username || user?.name || "").toLowerCase();
  }

  export function canEditTicket(user, ticket) {
    // أي يوزر عنده رول يكدر يعدل تكتاته (assigned أو created)
    if (!user || !ticket) return false;
    if (isAdmin(user) || isBayanUser(user)) return true;
    const name = userNameOf(user);
    if (!name) return false;
    return (
      (ticket.assignedTo || "").toLowerCase() === name ||
      (ticket.createdBy || "").toLowerCase() === name
    );
  }

  export function canEditRate(user) {
    // بس الأدمن يعدل الـ rate
    return isAdmin(user);
  }

  export function canEditPaid(user) {
    // بس الأدمن يعدل Paid/Unpaid
    return isAdmin(user);
  }

  export function canMarkDone(user, ticket) {
    // admin، أو الـ assigned، أو bayan
    if (isBayanUser(user)) return true;
    if (isAdmin(user)) return true;
    const name = userNameOf(user);
    return (ticket?.assignedTo || "").toLowerCase() === name;
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
    const name = userNameOf(user);
    return (
      (ticket.createdBy || "").toLowerCase() === name ||
      (ticket.assignedTo || "").toLowerCase() === name
    );
  }