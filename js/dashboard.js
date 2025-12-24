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
  orderBy,
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
// AUTHOR INFO
// ================================
function loadAuthorInfo(user) {
  // TODO:
  // - render nama author
  // - validasi role (author)
}

// ================================
// LOAD COMIC LIST
// ================================
async function loadMyComics(uid) {
  // TODO:
  // - query comics by authorId
  // - render card comic
  // - hitung statistik
}

// ================================
// CREATE SERIES
// ================================
function bindCreateSeries(uid) {
  const btn = document.getElementById('btn-create-series')
  if (!btn) return

  btn.onclick = async () => {
    // TODO:
    // - create comic (draft)
    // - redirect ke manage.html?id=
  }
}

// ================================
// RENDER HELPERS
// ================================
function renderComicCard(comicId, data) {
  // TODO:
  // - template card comic
}

function renderStats(stats) {
  // TODO:
  // - total comic
  // - draft
  // - published
}
