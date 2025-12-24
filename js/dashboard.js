// ================================
// dashboard.js
// Author Dashboard Controller
// ================================

import { db } from './firebase.js'
import { requireAuth, logout } from './auth.js'

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'

// ================================
// ENTRY
// ================================
requireAuth(user => {
  initDashboard(user)
})

// ================================
// INIT
// ================================
function initDashboard(user) {
  loadMyComics(user.uid)
  bindCreateSeries(user.uid)
  bindLogout()
}

// ================================
// LOGOUT
// ================================
function bindLogout() {
  const btn = document.getElementById('btn-logout')
  if (!btn) return
  btn.onclick = logout
}

// ================================
// LOAD MY COMICS
// ================================
async function loadMyComics(uid) {
  const listEl = document.getElementById('my-comic-list')
  if (!listEl) return

  listEl.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#8b949e;">
    Memuat comic...
  </p>`

  try {
    const q = query(
      collection(db, 'comics'),
      where('authorId', '==', uid)
    )

    const snap = await getDocs(q)
    listEl.innerHTML = ''

    let total = 0
    let draft = 0
    let published = 0

    if (snap.empty) {
      listEl.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#8b949e;">
        Kamu belum punya comic
      </p>`
    }

    snap.forEach(docSnap => {
      total++
      const data = docSnap.data()

      if (data.status === 'published') published++
      else draft++

      const card = document.createElement('div')
      card.className = 'card'
      card.innerHTML = `
        <h4>${data.title || 'Untitled'}</h4>
        <p>Status: <strong>${data.status}</strong></p>
        <button class="btn"
          onclick="location.href='manage.html?id=${docSnap.id}'">
          Kelola
        </button>
      `
      listEl.appendChild(card)
    })

    renderStats({ total, draft, published })

  } catch (err) {
    console.error(err)
    listEl.innerHTML = 'Gagal memuat comic'
  }
}

// ================================
// CREATE SERIES (DRAFT)
// ================================
function bindCreateSeries(uid) {
  const btn = document.getElementById('btn-create-series')
  if (!btn) return

  btn.onclick = async () => {
    btn.disabled = true
    btn.innerText = 'Membuat...'

    try {
      const title = document.getElementById('comic-title')?.value || 'Untitled'
      const genre = document.getElementById('comic-genre')?.value || ''
      const summary = document.getElementById('comic-summary')?.value || ''

      const docRef = await addDoc(collection(db, 'comics'), {
        title,
        genre,
        summary,
        authorId: uid,
        status: 'draft',
        createdAt: serverTimestamp()
      })

      location.href = `manage.html?id=${docRef.id}`

    } catch (err) {
      alert('Gagal membuat series')
      console.error(err)
      btn.disabled = false
      btn.innerText = 'BUAT DRAFT'
    }
  }
}

// ================================
// STATS
// ================================
function renderStats(stats) {
  const totalEl = document.getElementById('stat-total')
  const draftEl = document.getElementById('stat-draft')
  const pubEl = document.getElementById('stat-published')

  if (totalEl) totalEl.innerText = stats.total
  if (draftEl) draftEl.innerText = stats.draft
  if (pubEl) pubEl.innerText = stats.published
}
