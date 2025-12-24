// ================================
// manage.js
// Manage Comic & Chapter (FINAL)
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

import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js'

const storage = getStorage()

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
// LOAD COMIC
// ================================
async function loadComic(comicId, uid) {
  const snap = await getDoc(doc(db, 'comics', comicId))
  if (!snap.exists()) return alert('Comic tidak ada')

  const data = snap.data()
  if (data.authorId !== uid) {
    alert('Akses ditolak')
    location.href = 'dashboard.html'
    return
  }

  setVal('comic-title', data.title)
  setVal('comic-genre', data.genre)
  setVal('comic-summary', data.summary)
  enableInputs()
}

// ================================
// SAVE COMIC
// ================================
function bindSaveComic(comicId) {
  const btn = document.getElementById('saveBtn')
  if (!btn) return

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
// UPLOAD CHAPTER + FILE
// ================================
function bindUploadChapter(comicId) {
  const btn = document.getElementById('btn-upload-chapter')
  const fileInput = document.getElementById('ch-file')
  const progress = document.getElementById('upload-progress')

  if (!btn) return

  btn.onclick = async () => {
    const title = getVal('ch-title')
    const file = fileInput.files[0]

    if (!title || !file) {
      alert('Judul & file wajib')
      return
    }

    const fileRef = ref(
      storage,
      `chapters/${comicId}/${Date.now()}-${file.name}`
    )

    const task = uploadBytesResumable(fileRef, file)

    task.on('state_changed', snap => {
      progress.value = (snap.bytesTransferred / snap.totalBytes) * 100
    })

    await task
    const fileUrl = await getDownloadURL(fileRef)

    await addDoc(collection(db, 'chapters'), {
      comicId,
      title,
      fileUrl,
      createdAt: serverTimestamp()
    })

    setVal('ch-title', '')
    fileInput.value = ''
    progress.value = 0

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

  snap.forEach((d, i) => {
    const c = d.data()
    const div = document.createElement('div')
    div.className = 'card'
    div.innerHTML = `
      <strong>Chapter ${i + 1}</strong>
      <p>${c.title}</p>
      <a href="${c.fileUrl}" target="_blank">Lihat File</a>
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
