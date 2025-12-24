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

// ================================
// PARAM
// ================================
const params = new URLSearchParams(window.location.search);
const comicId = params.get("id");

// ================================
// ELEMENT
// ================================
const titleEl = document.getElementById("comic-title");
const genreEl = document.getElementById("comic-genre");
const summaryEl = document.getElementById("comic-summary");
const coverEl = document.getElementById("comic-cover");
const chapterListEl = document.getElementById("chapters-container");

// ================================
// GUARD
// ================================
if (!comicId) {
  titleEl.innerText = "Komik tidak ditemukan";
  throw new Error("Missing comic id");
}

// ================================
// LOAD DETAIL
// ================================
async function loadDetail() {
  try {
    // --- COMIC ---
    const comicSnap = await getDoc(doc(db, "comics", comicId));

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

    // --- CHAPTER ---
    chapterListEl.innerHTML =
      `<p class="empty">Memuat chapter...</p>`;

    const q = query(
      collection(db, "comics", comicId, "chapters"),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      chapterListEl.innerHTML =
        `<p class="empty">Belum ada chapter</p>`;
      return;
    }

    chapterListEl.innerHTML = "";

    snap.forEach(docSnap => {
      const ch = docSnap.data();

      const a = document.createElement("a");
      a.href = `reader.html?comic=${comicId}&chapter=${docSnap.id}`;
      a.className = "chapter-item";
      a.innerHTML = `
        <span>${ch.title || "Chapter Baru"}</span>
        <small>
          ${ch.createdAt?.toDate()?.toLocaleDateString("id-ID") || ""}
        </small>
      `;

      chapterListEl.appendChild(a);
    });

  } catch (err) {
    console.error("Detail error:", err);
    chapterListEl.innerHTML =
      `<p class="empty" style="color:red;">Gagal memuat data</p>`;
  }
}

loadDetail();
