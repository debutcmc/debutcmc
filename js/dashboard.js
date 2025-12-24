// ================================
// dashboard.js
// Author Dashboard Controller
// ================================

import { db } from './firebase.js'
import { requireAuth } from './auth.js'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'

// ================================
// ENTRY POINT
// ================================
requireAuth(async (user) => {
  initDashboard(user)
})

// ================================
// INIT
// ================================
function initDashboard(user) {
  loadAuthorInfo(user)
  loadMyComics(user.uid)
  bindCreateSeries(user.uid)
}

// ================================
// AUTHOR INFO (STEP 1)
// ================================
function loadAuthorInfo(user) {
  const nameEl = document.getElementById('author-name')
  const emailEl = document.getElementById('author-email')

  if (nameEl) {
    nameEl.innerText = user.displayName || 'Author'
  }

  if (emailEl) {
    emailEl.innerText = user.email
  }
}

// ================================
// LOAD COMIC LIST (STEP 2)
// ================================
async function loadMyComics(uid) {
  const listEl = document.getElementById('my-comic-list')
  if (!listEl) return

  listEl.innerHTML = 'Loading...'

  try {
    const q = query(
      collection(db, 'comics'),
      where('authorId', '==', uid)
    )

    const snap = await getDocs(q)

    listEl.innerHTML = ''

    if (snap.empty) {
      listEl.innerHTML = `
        <p style="color:#888;text-align:center">
          Kamu belum punya comic.
        </p>
      `
      renderStats({
        total: 0,
        draft: 0,
        published: 0
      })
      return
    }

    let total = 0
    let draft = 0
    let published = 0

    snap.forEach(docSnap => {
      total++
      const data = docSnap.data()

      if (data.status === 'published') {
        published++
      } else {
        draft++
      }

      const card = renderComicCard(docSnap.id, data)
      listEl.appendChild(card)
    })

    renderStats({ total, draft, published })

  } catch (err) {
    console.error(err)
    listEl.innerHTML = 'Gagal memuat comic.'
  }
}

// ================================
// CREATE SERIES (DRAFT ONLY)
// ================================
function bindCreateSeries(uid) {
  const btn = document.getElementById('btn-create-series')
  if (!btn) return

  btn.onclick = async () => {
    btn.disabled = true

    try {
      const docRef = await addDoc(collection(db, 'comics'), {
        title: 'Untitled Comic',
        authorId: uid,
        status: 'draft',
        createdAt: serverTimestamp()
      })

      window.location.href = `manage.html?id=${docRef.id}`

    } catch (err) {
      alert('Gagal membuat series')
      console.error(err)
      btn.disabled = false
    }
  }
}

// ================================
// RENDER HELPERS
// ================================
function renderComicCard(comicId, data) {
  const div = document.createElement('div')
  div.className = 'comic-card'

  div.innerHTML = `
    <h4>${data.title || 'Untitled'}</h4>
    <p>Status: <strong>${data.status || 'draft'}</strong></p>
    <button onclick="location.href='manage.html?id=${comicId}'">
      Kelola
    </button>
  `
  return div
}

function renderStats(stats) {
  const totalEl = document.getElementById('stat-total')
  const draftEl = document.getElementById('stat-draft')
  const pubEl = document.getElementById('stat-published')

  if (totalEl) totalEl.innerText = stats.total
  if (draftEl) draftEl.innerText = stats.draft
  if (pubEl) pubEl.innerText = stats.published
}
