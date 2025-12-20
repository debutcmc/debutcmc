// 1. IMPORT FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 2. CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyCt2j9hATOmWYqdknCi05j8zIO59SaF578",
    authDomain: "debutcmc-ec2ad.firebaseapp.com",
    projectId: "debutcmc-ec2ad",
    storageBucket: "debutcmc-ec2ad.firebasestorage.app",
    messagingSenderId: "283108871954",
    appId: "1:283108871954:web:5900298201e74ce83d2dcb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- A. FUNGSI LOGIN GLOBAL ---
window.loginGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        console.log("CEO Login detected:", result.user.displayName);
        // Jika login di index, otomatis arahkan ke dashboard
        if (window.location.pathname.includes('index.html')) {
            window.location.href = "dashboard.html";
        }
    } catch (error) {
        console.error("Login Error:", error);
    }
};

// --- B. SATU OBSERVER UNTUK SEMUA (NAVBAR & PROTEKSI) ---
onAuthStateChanged(auth, async (user) => {
    const authSection = document.getElementById('auth-section');
    const dashboardUI = document.getElementById('dashboard-ui');
    const authOverlay = document.getElementById('auth-overlay');

    if (user) {
        // 1. Registrasi ke Firestore
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
            displayName: user.displayName,
            photoURL: user.photoURL,
            email: user.email,
            uid: user.uid,
            username: user.email.split('@')[0],
            bio: "Member DebutCMC"
        }, { merge: true });

        // 2. Update Navbar UI
        if (authSection) {
            const userPhoto = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=00ff88&color=0b0e14`;
            authSection.innerHTML = `
                <div class="user-profile-nav" style="display:flex; align-items:center; gap:12px;">
                    <div class="nav-user-info" style="text-align:right;">
                        <span style="display:block; font-size:12px; font-weight:bold; color:#00ff88;">CEO</span>
                        <span style="display:block; font-size:10px; color:#8b949e;">${user.displayName.split(' ')[0]}</span>
                    </div>
                    <a href="dashboard.html">
                        <img src="${userPhoto}" style="width:38px; height:38px; border-radius:50%; border:2px solid #00ff88; cursor:pointer;">
                    </a>
                </div>`;
        }

        // 3. Dashboard Logic
        if (window.location.pathname.includes('dashboard.html')) {
            if(dashboardUI) dashboardUI.style.display = 'block';
            if(authOverlay) authOverlay.style.display = 'none';
            muatKomikSaya();
        }

        muatProfil();
    } else {
        // User Logout Logic
        if (authSection) {
            authSection.innerHTML = `<button onclick="loginGoogle()" style="background:#00ff88; color:black; border:none; padding:8px 20px; border-radius:5px; font-weight:bold; cursor:pointer;">SIGN IN</button>`;
        }
        if (window.location.pathname.includes('dashboard.html')) {
            if(dashboardUI) dashboardUI.style.display = 'none';
            if(authOverlay) authOverlay.style.display = 'block';
        }
    }
});

// --- C. LOGIKA UPLOAD ---
const uploadBtn = document.getElementById('upload-trigger');
if (uploadBtn) {
    uploadBtn.addEventListener('click', async () => {
        const file = document.getElementById('file-input').files[0];
        const judul = document.getElementById('comic-title').value;
        const status = document.getElementById('upload-status');

        if (!file || !judul) return alert("Isi judul dan pilih gambar!");

        status.innerText = "🚀 Uploading...";
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('https://api.imgbb.com/1/upload?key=daa2bcb021279c96cebd854f8650d77e', { method: 'POST', body: formData });
            const dataImg = await res.json();

            await addDoc(collection(db, "comics"), {
                title: judul,
                coverUrl: dataImg.data.url,
                authorId: auth.currentUser.uid,
                createdAt: serverTimestamp()
            });
            alert("Berhasil Rilis!");
            location.reload();
        } catch (e) { console.error(e); }
    });
}

// --- D. FUNGSI KELOLA & LIST ---
async function muatKomikSaya() {
    const list = document.getElementById('my-comic-list');
    if (!list) return;
    const q = query(collection(db, "comics"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    list.innerHTML = "";
    snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.authorId === auth.currentUser.uid) {
            list.innerHTML += `<div style="display:flex; justify-content:space-between; background:#161a21; padding:10px; margin-bottom:5px; border-radius:5px;">
                <span>${data.title}</span>
                <button onclick="hapusKomik('${docSnap.id}')" style="color:#ff4444; background:none; border:none; cursor:pointer;">Hapus</button>
            </div>`;
        }
    });
}

window.hapusKomik = async (id) => {
    if (confirm("Hapus komik?")) {
        const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        await deleteDoc(doc(db, "comics", id));
        muatKomikSaya();
    }
};

// Fungsi Logout
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', () => signOut(auth).then(() => window.location.href = "index.html"));
}

// Load Home Grid
async function loadHome() {
    const grid = document.getElementById('comic-list');
    if (!grid) return;
    const q = query(collection(db, "comics"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    grid.innerHTML = "";
    snap.forEach(d => {
        const data = d.data();
        grid.innerHTML += `<a href="detail.html?id=${d.id}" class="comic-card">
            <img src="${data.coverUrl}" style="width:100%; aspect-ratio:3/4; object-fit:cover; border-radius:8px;">
            <h4>${data.title}</h4>
        </a>`;
    });
}
loadHome();
