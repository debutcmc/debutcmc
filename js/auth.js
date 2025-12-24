// js/auth.js
import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from 
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export function guardPage(redirect = "index.html") {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = redirect;
    }
  });
}

export function watchAuth(callback) {
  onAuthStateChanged(auth, callback);
}

export async function logout() {
  if (confirm("Logout dari akun?")) {
    await signOut(auth);
    location.href = "index.html";
  }
}
