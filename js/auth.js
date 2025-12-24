// js/auth.js
import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/**
 * 🔒 GUARD HALAMAN
 * Redirect ke index.html kalau belum login
 */
export function requireAuth(callback) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    // user valid
    if (callback) callback(user);
  });
}

/**
 * 🚪 LOGOUT
 */
export async function logout() {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (err) {
    console.error("Logout error:", err);
  }
}
