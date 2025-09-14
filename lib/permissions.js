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
  
  export function canMarkDone(user, ticket) {
    // الكل يكدر يـ"Done" بس اذا هو صاحب التكت أو admin
    return isAdmin(user) || ticket.assignedTo === user.username;
  }
  
  export function canViewTicket(user, ticket) {
    // الادمن يشوف الكل، الباقي يشوفون تكتاتهم فقط
    return isAdmin(user) || 
           ticket.createdBy === user.username || 
           ticket.assignedTo === user.username;
  }