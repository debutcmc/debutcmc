// js/detail.js
import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ambil comic id
const params = new URLSearchParams(window.location.search);
const comicId = params.get("comic");

const titleEl = document.getElementById("comic-title");
const genreEl = document.getElementById("comic-genre");
const summaryEl = document.getElementById("comic-summary");
const coverEl = document.getElementById("comic-cover");
const chapterListEl = document.getElementById("chapter-list");

if (!comicId) {
  if (titleEl) titleEl.innerText = "Komik tidak ditemukan";
  throw new Error("Missing comic id");
}

async function loadDetail() {
  try {
    // --- ambil data komik ---
    const comicRef = doc(db, "comics", comicId);
    const comicSnap = await getDoc(comicRef);

    if (!comicSnap.exists()) {
      titleEl.innerText = "Komik tidak ada";
      return;
    }

    const comic = comicSnap.data();

    titleEl.innerText = comic.title || "Untitled";
    genreEl.innerText = comic.genre || "-";
    summaryEl.innerText = comic.summary || "Belum ada sinopsis";
    coverEl.src =
      comic.coverUrl ||
      "https://placehold.co/300x400/161a21/00ff88?text=No+Cover";

    // --- ambil chapter ---
    chapterListEl.innerHTML =
      "<p style='color:#8b949e;'>Memuat chapter...</p>";

    const q = query(
      collection(db, "comics", comicId, "chapters"),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      chapterListEl.innerHTML =
        "<p style='color:#8b949e;'>Belum ada chapter</p>";
      return;
    }

    chapterListEl.innerHTML = "";
    snap.forEach((docSnap) => {
      const ch = docSnap.data();

      const a = document.createElement("a");
      a.href = `reader.html?comic=${comicId}&chapter=${docSnap.id}`;
      a.className = "chapter-item";
      a.innerHTML = `
        <span>${ch.title || "Chapter Baru"}</span>
        <small style="opacity:.6;">
          ${ch.createdAt?.toDate()?.toLocaleDateString("id-ID") || ""}
        </small>
      `;

      chapterListEl.appendChild(a);
    });
  } catch (err) {
    console.error("Detail error:", err);
    chapterListEl.innerHTML =
      "<p style='color:red;'>Gagal memuat data</p>";
  }
}

loadDetail();
