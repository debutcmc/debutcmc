// ================================
// manage.js
// Manage Comic & Chapter
// ================================

import { db } from './firebase.js'
import { requireAuth } from './auth.js'

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'

// ================================
// ENTRY
// ================================
requireAuth(async (user) => {
  const comicId = new URLSearchParams(location.search).get('id')
  if (!comicId) {
    alert('Comic tidak ditemukan')
    location.href = 'dashboard.html'
    return
  }

  await loadComic(comicId, user.uid)
  bindSaveComic(comicId)
  bindUploadChapter(comicId)
  loadChapters(comicId)
})

// ================================
// LOAD COMIC DATA
// ================================
async function loadComic(comicId, uid) {
  const ref = doc(db, 'comics', comicId)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    alert('Comic tidak ditemukan')
    return
  }

  const data = snap.data()
  if (data.authorId !== uid) {
    alert('Akses ditolak')
    location.href = 'dashboard.html'
    return
  }

  // isi form
  enableInputs()
  setVal('comic-title', data.title)
  setVal('comic-genre', data.genre)
  setVal('comic-summary', data.summary)
}

// ================================
// SAVE COMIC
// ================================
function bindSaveComic(comicId) {
  const btn = document.getElementById('saveBtn')
  if (!btn) return

  btn.classList.remove('disabled')

  btn.onclick = async () => {
    btn.innerText = 'Menyimpan...'

    await updateDoc(doc(db, 'comics', comicId), {
      title: getVal('comic-title'),
      genre: getVal('comic-genre'),
      summary: getVal('comic-summary'),
      updatedAt: serverTimestamp()
    })

    btn.innerText = 'Tersimpan ✓'
    setTimeout(() => (btn.innerText = 'Simpan & Lanjut'), 1500)
  }
}

// ================================
// CHAPTER UPLOAD (METADATA)
// ================================
function bindUploadChapter(comicId) {
  const btn = document.getElementById('btn-upload-chapter')
  if (!btn) return

  btn.onclick = async () => {
    const title = getVal('ch-title')
    if (!title) {
      alert('Judul chapter wajib')
      return
    }

    await addDoc(collection(db, 'chapters'), {
      comicId,
      title,
      createdAt: serverTimestamp()
    })

    setVal('ch-title', '')
    loadChapters(comicId)
  }
}

// ================================
// LOAD CHAPTER LIST
// ================================
async function loadChapters(comicId) {
  const list = document.getElementById('chapter-list')
  if (!list) return
  list.innerHTML = ''

  const q = query(
    collection(db, 'chapters'),
    where('comicId', '==', comicId),
    orderBy('createdAt', 'asc')
  )

  const snap = await getDocs(q)

  snap.forEach((docSnap, i) => {
    const div = document.createElement('div')
    div.className = 'card'
    div.innerHTML = `
      <strong>Chapter ${i + 1}</strong>
      <p>${docSnap.data().title}</p>
    `
    list.appendChild(div)
  })
}

// ================================
// HELPERS
// ================================
function setVal(id, val) {
  const el = document.getElementById(id)
  if (el) el.value = val ?? ''
}

function getVal(id) {
  return document.getElementById(id)?.value.trim()
}

function enableInputs() {
  document
    .querySelectorAll('input, textarea, select')
    .forEach(el => (el.disabled = false))
}
