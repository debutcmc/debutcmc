import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// EMAIL LOGIN
document.getElementById("btn-email").onclick = async () => {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  if (!email || !pass) {
    alert("Email & password wajib");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    location.href = "dashboard.html";
  } catch (e) {
    alert("Gagal login: " + e.message);
  }
};

// GOOGLE LOGIN
document.getElementById("btn-google").onclick = async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    location.href = "dashboard.html";
  } catch (e) {
    alert("Google login gagal");
  }
};
