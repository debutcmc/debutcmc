// js/reader.js
import { db } from "./firebase.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const comicId = params.get("comic");
const chapterId = params.get("chapter");

const titleEl = document.getElementById("chapter-title");
const container = document.getElementById("page-container");

if (!comicId || !chapterId) {
  if (titleEl) titleEl.innerText = "Chapter tidak ditemukan";
  throw new Error("Missing comic or chapter id");
}

async function loadChapter() {
  container.innerHTML = `<p style="text-align:center;color:#8b949e;padding:60px;">
    Memuat chapter...
  </p>`;

  try {
    const ref = doc(db, "comics", comicId, "chapters", chapterId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      titleEl.innerText = "Chapter tidak ada";
      container.innerHTML = "";
      return;
    }

    const data = snap.data();
    titleEl.innerText = data.title || "Chapter";

    if (!Array.isArray(data.pages) || data.pages.length === 0) {
      container.innerHTML = "<p style='text-align:center;'>Chapter kosong</p>";
      return;
    }

    container.innerHTML = "";
    data.pages.forEach((url) => {
      const div = document.createElement("div");
      div.className = "reader-page";
      div.innerHTML = `
        <img 
          src="${url}" 
          loading="lazy"
          onerror="this.src='https://placehold.co/800x1200?text=Image+Error'"
        >
      `;
      container.appendChild(div);
    });

    window.scrollTo({ top: 0 });
  } catch (err) {
    console.error("Load chapter error:", err);
    container.innerHTML =
      "<p style='text-align:center;color:#ff4444;'>Gagal memuat chapter</p>";
  }
}

loadChapter();
