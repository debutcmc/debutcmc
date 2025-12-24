// manage.js
import { db, auth } from './firebase.js'
import { requireAuth, logout } from './auth.js'
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'

const params = new URLSearchParams(window.location.search)
const comicId = params.get('id')

if (!comicId) {
  alert('Comic ID tidak ditemukan')
  location.href = 'dashboard.html'
}

// ================= ENTRY =================
requireAuth((user) => {
  loadComic(user.uid)
  loadChapters()
})

// ================= LOAD COMIC =================
async function loadComic(uid) {
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

  document.getElementById('comic-title').value = data.title || ''
  document.getElementById('comic-genre').value = data.genre || ''
  document.getElementById('comic-summary').value = data.summary || ''
}

// ================= SAVE COMIC =================
document.getElementById('btn-save-comic').onclick = async () => {
  await updateDoc(doc(db, 'comics', comicId), {
    title: document.getElementById('comic-title').value,
    genre: document.getElementById('comic-genre').value,
    summary: document.getElementById('comic-summary').value,
    updatedAt: serverTimestamp()
  })

  alert('Perubahan disimpan')
}

// ================= CHAPTER =================
async function loadChapters() {
  const list = document.getElementById('chapter-list')
  list.innerHTML = 'Loading...'

  const q = query(
    collection(db, 'chapters'),
    where('comicId', '==', comicId)
  )

  const snap = await getDocs(q)
  list.innerHTML = ''

  if (snap.empty) {
    list.innerHTML = '<p>Belum ada chapter</p>'
    return
  }

  snap.forEach(doc => {
    const d = doc.data()
    const div = document.createElement('div')
    div.innerHTML = `• ${d.title}`
    list.appendChild(div)
  })
}

// ================= CREATE CHAPTER (DUMMY) =================
document.getElementById('btn-create-chapter').onclick = async () => {
  const title = document.getElementById('chapter-title').value
  if (!title) return alert('Judul chapter wajib')

  await addDoc(collection(db, 'chapters'), {
    comicId,
    title,
    createdAt: serverTimestamp()
  })

  document.getElementById('chapter-title').value = ''
  loadChapters()
}

// ================= LOGOUT =================
document.getElementById('btn-logout').onclick = logout
