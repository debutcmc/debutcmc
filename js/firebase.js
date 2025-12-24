// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCt2j9hATOmWYqdknCi05j8zIO59SaF578",
  authDomain: "debutcmc-ec2ad.firebaseapp.com",
  projectId: "debutcmc-ec2ad",
  storageBucket: "debutcmc-ec2ad.firebasestorage.app",
  appId: "1:283108871954:web:5900298201e74ce83d2dcb"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
