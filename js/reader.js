import { db } from './firebase.js'
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"

// ambil parameter
const params = new URLSearchParams(window.location.search)
const comicId = params.get('comic')
const chapterId = params.get('chapter')

const titleEl = document.getElementById('chapter-title')
const container = document.getElementById('page-container')

if (!comicId || !chapterId) {
  titleEl.innerText = 'Chapter tidak ditemukan'
  throw new Error('Missing parameter')
}

async function loadChapter() {
  const ref = doc(db, 'comics', comicId, 'chapters', chapterId)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    titleEl.innerText = 'Chapter tidak ada'
    return
  }

  const data = snap.data()
  titleEl.innerText = data.title || 'Chapter'

  // pages = array URL gambar
  if (!data.pages || data.pages.length === 0) {
    container.innerHTML = '<p>Chapter kosong</p>'
    return
  }

  container.innerHTML = ''
  data.pages.forEach(url => {
    const div = document.createElement('div')
    div.className = 'reader-page'
    div.innerHTML = `<img src="${url}" loading="lazy">`
    container.appendChild(div)
  })
}

loadChapter()
