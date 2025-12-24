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

/**
 * 🔥 LOAD HOME
 * Menampilkan semua comic yang status = published
 */
export async function loadHome() {
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

    snap.forEach((docSnap) => {
      const comic = docSnap.data();

      const cover = comic.coverUrl || PLACEHOLDER_COVER;
      const title = comic.title || "Untitled";
      const genre = comic.genre || "Unknown";
      const lastChapter = comic.lastChapter || "-";

      const card = document.createElement("a");
      card.href = `detail.html?comic=${docSnap.id}`;
      card.className = "comic-card";
      card.style.textDecoration = "none";

      card.innerHTML = `
        <div class="comic-cover" style="position:relative;aspect-ratio:3/4;">
          <img 
            src="${cover}" 
            alt="${title}"
            loading="lazy"
            onerror="this.src='${PLACEHOLDER_COVER}'"
            style="width:100%;height:100%;object-fit:cover;border-radius:8px;"
          />

          <span style="
            position:absolute;
            top:6px;
            right:6px;
            background:#00ff88;
            color:#000;
            font-size:10px;
            font-weight:800;
            padding:2px 6px;
            border-radius:4px;
          ">
            ${comic.status?.toUpperCase() || "PUBLISHED"}
          </span>
        </div>

        <div class="comic-info" style="padding:6px 2px;">
          <div style="
            color:#fff;
            font-size:14px;
            font-weight:700;
            line-height:1.2;
            margin-bottom:2px;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
          ">
            ${title}
          </div>

          <div style="font-size:11px;color:#8b949e;">
            <span style="color:#00ff88;">${genre}</span>
            <span style="opacity:.5;"> • </span>
            Ch. ${lastChapter}
          </div>
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

// AUTO RUN
document.addEventListener("DOMContentLoaded", loadHome);
