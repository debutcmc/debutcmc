// ================================
// manage.js (FINAL FIXED)
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
  orderBy,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'

import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js'

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
// UPLOAD CHAPTER (MULTI IMAGE)
// ================================
function bindUploadChapter(comicId) {
  const btn = document.getElementById('btn-upload-chapter')
  const fileInput = document.getElementById('ch-file') // multiple
  const progress = document.getElementById('upload-progress')

  if (!btn) return

  btn.onclick = async () => {
    const title = getVal('ch-title')
    const files = [...fileInput.files]

    if (!title || files.length === 0) {
      alert('Judul & halaman wajib')
      return
    }

    btn.disabled = true
    progress.value = 0

    try {
      const pages = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileRef = ref(
          storage,
          `chapters/${comicId}/${Date.now()}-${file.name}`
        )

        const task = uploadBytesResumable(fileRef, file)

        await new Promise((resolve, reject) => {
          task.on(
            'state_changed',
            snap => {
              progress.value =
                ((i + snap.bytesTransferred / snap.totalBytes) /
                  files.length) *
                100
            },
            reject,
            resolve
          )
        })

        const url = await getDownloadURL(fileRef)
        pages.push(url)
      }

      await addDoc(
        collection(db, 'comics', comicId, 'chapters'),
        {
          title,
          pages,
          createdAt: serverTimestamp()
        }
      )

      setVal('ch-title', '')
      fileInput.value = ''
      progress.value = 0

      loadChapters(comicId)
    } catch (err) {
      console.error(err)
      alert('Gagal upload chapter')
    } finally {
      btn.disabled = false
    }
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
    collection(db, 'comics', comicId, 'chapters'),
    orderBy('createdAt', 'asc')
  )

  const snap = await getDocs(q)

  if (snap.empty) {
    list.innerHTML = `<p style="color:#888">Belum ada chapter</p>`
    return
  }

  snap.forEach((d, i) => {
    const c = d.data()
    const div = document.createElement('div')
    div.className = 'card'
    div.innerHTML = `
      <strong>Chapter ${i + 1}</strong>
      <p>${c.title}</p>
      <small>${c.pages?.length || 0} halaman</small>
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
