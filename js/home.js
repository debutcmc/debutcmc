// js/home.js
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const PLACEHOLDER_COVER =
  "https://placehold.co/300x400/161a21/00ff88?text=No+Cover";

async function loadHome() {
  const grid = document.getElementById("comic-list");
  if (!grid) return;

  grid.innerHTML = `
    <p style="grid-column:1/-1;text-align:center;color:#8b949e;padding:40px;">
      Memuat komik...
    </p>
  `;

  try {
    const q = query(
      collection(db, "comics"),
      where("status", "==", "published"),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);
    grid.innerHTML = "";

    if (snap.empty) {
      grid.innerHTML = `
        <p style="grid-column:1/-1;text-align:center;color:#8b949e;padding:40px;">
          Belum ada komik dipublish
        </p>
      `;
      return;
    }

    snap.forEach(docSnap => {
      const comic = docSnap.data();

      const card = document.createElement("a");
      card.href = `detail.html?id=${docSnap.id}`;
      card.className = "comic-card";

      card.innerHTML = `
        <div class="img-container">
          <img
            src="${comic.coverUrl || PLACEHOLDER_COVER}"
            alt="${comic.title || "Comic"}"
            loading="lazy"
            onerror="this.src='${PLACEHOLDER_COVER}'"
          />
          <span class="card-tag">NEW</span>
        </div>

        <div class="comic-info">
          <p class="comic-title">
            ${comic.title || "Untitled"}
          </p>
          <p class="comic-meta">
            ${comic.genre || "Unknown"}
          </p>
        </div>
      `;

      grid.appendChild(card);
    });
  } catch (err) {
    console.error("Load home error:", err);
    grid.innerHTML = `
      <p style="grid-column:1/-1;text-align:center;color:#ff4444;padding:40px;">
        Gagal memuat data
      </p>
    `;
  }
}

document.addEventListener("DOMContentLoaded", loadHome);
