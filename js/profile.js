// js/profile.js
import { requireAuth } from './auth.js'
import { db } from './firebase.js'

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js'

const storage = getStorage()

const els = {
  avatarInput: document.getElementById('avatar-input'),
  avatarImg: document.getElementById('profile-img'),
  username: document.getElementById('username'),
  bio: document.getElementById('bio'),
  email: document.getElementById('email'),
  saveBtn: document.getElementById('save-profile'),
  badge: document.getElementById('role-badge')
}

// ================= ENTRY =================
requireAuth(async (user) => {
  els.email.value = user.email
  await loadProfile(user.uid)
  bindAvatarPreview()
  bindSave(user.uid)
})

// ================= LOAD =================
async function loadProfile(uid) {
  const refDoc = doc(db, 'users', uid)
  const snap = await getDoc(refDoc)

  if (!snap.exists()) {
    await setDoc(refDoc, {
      email: els.email.value,
      role: 'member',
      createdAt: serverTimestamp()
    })
    return
  }

  const d = snap.data()
  els.username.value = d.username || ''
  els.bio.value = d.bio || ''
  els.avatarImg.src = d.avatarUrl || els.avatarImg.src
  els.badge.innerText = (d.role || 'member').toUpperCase()
}

// ================= AVATAR PREVIEW =================
function bindAvatarPreview() {
  els.avatarInput.onchange = () => {
    const file = els.avatarInput.files[0]
    if (file) {
      els.avatarImg.src = URL.createObjectURL(file)
    }
  }
}

// ================= SAVE =================
function bindSave(uid) {
  els.saveBtn.onclick = async () => {
    els.saveBtn.innerText = 'Menyimpan...'

    let avatarUrl = null
    const file = els.avatarInput.files[0]

    if (file) {
      const avatarRef = ref(storage, `avatars/${uid}`)
      await uploadBytes(avatarRef, file)
      avatarUrl = await getDownloadURL(avatarRef)
    }

    await updateDoc(doc(db, 'users', uid), {
      username: els.username.value.trim(),
      bio: els.bio.value.trim(),
      ...(avatarUrl && { avatarUrl }),
      updatedAt: serverTimestamp()
    })

    els.saveBtn.innerText = 'Tersimpan ✓'
    setTimeout(() => (els.saveBtn.innerText = 'SIMPAN'), 1500)
  }
}
