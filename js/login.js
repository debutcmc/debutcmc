import { auth } from './firebase.js'
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'

const provider = new GoogleAuthProvider()
const btn = document.getElementById('btn-google')

// kalau sudah login → langsung ke dashboard
onAuthStateChanged(auth, user => {
  if (user) {
    location.href = 'dashboard.html'
  }
})

btn.onclick = async () => {
  try {
    await signInWithPopup(auth, provider)
  } catch (err) {
    console.error(err)
    alert('Gagal login')
  }
}
