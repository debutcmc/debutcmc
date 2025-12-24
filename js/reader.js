// js/reader.js
import { db } from "./firebase.js"
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"

// ================= QUERY =================
const params = new URLSearchParams(location.search)
const comicId = params.get("comic")
const chapterId = params.get("chapter")

// ================= ELEMENT =================
const titleEl = document.getElementById("chapter-title")
const container = document.getElementById("page-container")
const footer = document.getElementById("reader-footer")

const header = document.getElementById("main-header")
const bottomNav = document.getElementById("bottom-nav")

const btnFullscreen = document.getElementById("btn-fullscreen")
const btnScrollTop = document.getElementById("btn-scroll-top")
const btnReload = document.getElementById("btn-reload")

// ================= VALIDATION =================
if (!comicId || !chapterId) {
  titleEl.innerText = "Chapter tidak ditemukan"
  throw new Error("Missing comic or chapter id")
}

// ================= LOAD CHAPTER =================
async function loadChapter() {
  container.innerHTML = `
    <p style="text-align:center;color:#8b949e;padding:60px;">
      Memuat chapter...
    </p>
  `

  try {
    const ref = doc(db, "comics", comicId, "chapters", chapterId)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      titleEl.innerText = "Chapter tidak ada"
      container.innerHTML = ""
      return
    }

    const data = snap.data()
    titleEl.innerText = data.title || "Chapter"

    if (!Array.isArray(data.pages) || data.pages.length === 0) {
      container.innerHTML =
        "<p style='text-align:center;'>Chapter kosong</p>"
      return
    }

    container.innerHTML = ""
    data.pages.forEach((url) => {
      const div = document.createElement("div")
      div.className = "reader-page"
      div.innerHTML = `
        <img
          src="${url}"
          loading="lazy"
          onerror="this.src='https://placehold.co/800x1200?text=Image+Error'"
        >
      `
      container.appendChild(div)
    })

    footer.style.display = "block"
    window.scrollTo({ top: 0 })
  } catch (err) {
    console.error("Load chapter error:", err)
    container.innerHTML =
      "<p style='text-align:center;color:#ff4444;'>Gagal memuat chapter</p>"
  }
}

// ================= UX BEHAVIOUR =================
let lastScroll = 0
window.addEventListener(
  "scroll",
  () => {
    const now = window.scrollY
    if (now > lastScroll && now > 120) {
      header.classList.add("hide")
      bottomNav.classList.add("low-opacity")
    } else {
      header.classList.remove("hide")
      bottomNav.classList.remove("low-opacity")
    }
    lastScroll = now
  },
  { passive: true }
)

// ================= BUTTONS =================
btnFullscreen.onclick = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

btnScrollTop.onclick = () => {
  window.scrollTo({ top: 0, behavior: "smooth" })
}

btnReload.onclick = () => {
  location.reload()
}

// ================= INIT =================
loadChapter()
