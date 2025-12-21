import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getFirestore, collection, doc, getDoc, getDocs, query, orderBy, where 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { 
    getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCt2j9hATOmWYqdknCi05j8zIO59SaF578",
    authDomain: "debutcmc-ec2ad.firebaseapp.com",
    projectId: "debutcmc-ec2ad",
    storageBucket: "debutcmc-ec2ad.firebasestorage.app",
    appId: "1:283108871954:web:5900298201e74ce83d2dcb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- AUTH LOGIC ---
window.loginGoogle = async () => {
    try { 
        await signInWithPopup(auth, provider); 
        location.reload(); 
    } catch (e) { 
        console.error("Login Gagal:", e); 
    }
};

onAuthStateChanged(auth, async (user) => {
    const section = document.getElementById('auth-section');
    if (user && section) {
        section.innerHTML = `
            <img src="${user.photoURL}" 
                 onclick="location.href='profile.html?uid=${user.uid}'" 
                 style="width:35px; height:35px; border-radius:50%; border:2px solid #00ff88; cursor:pointer; object-fit:cover;">`;
    }
    
    // Routing Otomatis berdasarkan URL
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const ch = urlParams.get('ch');
    const uid = urlParams.get('uid');
    
    // Cek jika di halaman index (Beranda)
    if (path.includes('index.html') || path.endsWith('/')) {
        loadHome();
    } 
    // Halaman Detail Komik
    else if (path.includes('detail.html')) {
        loadDetail(id);
    } 
    // Halaman Baca (Viewer)
    else if (path.includes('viewer.html')) {
        loadViewer(id, ch);
    } 
    // Halaman Profil User
    else if (path.includes('profile.html')) {
        loadProfile(uid);
    }
});

// --- LOAD HOME (BERANDA) ---
async function loadHome() {
    const grid = document.getElementById('comic-list');
    if (!grid) return;

    grid.innerHTML = "<p style='color:gray;'>Memuat karya terbaru...</p>";
    
    try {
        const q = query(collection(db, "comics"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        grid.innerHTML = "";

        if (snap.empty) {
            grid.innerHTML = "<p>Belum ada komik yang dirilis.</p>";
            return;
        }

        snap.forEach(d => {
            const data = d.data();
            // FILTER STATUS DIHAPUS agar semua komik Bapak muncul
            grid.innerHTML += `
                <a href="detail.html?id=${d.id}" class="comic-card" style="text-decoration:none; color:inherit;">
                    <div style="position:relative;">
                        <img src="${data.coverUrl}" loading="lazy" style="width:100%; border-radius:8px; aspect-ratio:3/4; object-fit:cover;">
                        <span style="position:absolute; top:8px; right:8px; background:#00ff88; color:#000; font-size:10px; padding:2px 8px; font-weight:bold; border-radius:4px;">
                            ${data.statusSeries || 'NEW'}
                        </span>
                    </div>
                    <h4 class="comic-title" style="margin:10px 0 5px 0; font-size:14px;">${data.title}</h4>
                    <p style="color:#00ff88; font-size:11px; margin:0;">${data.genre || 'Action'}</p>
                </a>`;
        });
    } catch (e) {
        console.error("Error Home:", e);
        grid.innerHTML = "<p>Gagal memuat data.</p>";
    }
}

// --- LOAD DETAIL ---
async function loadDetail(id) {
    if (!id) return;
    try {
        const snap = await getDoc(doc(db, "comics", id));
        if (snap.exists()) {
            const data = snap.data();
            
            // Update UI Detail (Pastikan ID ini ada di detail.html)
            if(document.getElementById('comic-title')) document.getElementById('comic-title').innerText = data.title;
            if(document.getElementById('comic-genre')) document.getElementById('comic-genre').innerText = data.genre;
            if(document.getElementById('comic-cover')) document.getElementById('comic-cover').src = data.coverUrl;
            
            const synopsisEl = document.querySelector('.synopsis');
            if(synopsisEl) synopsisEl.innerText = data.summary || "Tidak ada sinopsis.";
            
            // Muat Daftar Chapter
            const qCh = query(collection(db, "chapters"), where("comicId", "==", id), orderBy("createdAt", "desc"));
            const cSnap = await getDocs(qCh);
            const container = document.getElementById('chapters-container');
            
            if (container) {
                container.innerHTML = "";
                if (cSnap.empty) {
                    container.innerHTML = "<p style='color:gray; padding:20px;'>Belum ada chapter.</p>";
                }
                cSnap.forEach((c) => {
                    const chData = c.data();
                    container.innerHTML += `
                        <a href="viewer.html?id=${id}&ch=${c.id}" class="chapter-item" style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid #2d333b; text-decoration:none; color:white;">
                            <span>${chData.chapterTitle}</span>
                            <span class="btn-read" style="background:#00ff88; color:#000; padding:4px 12px; border-radius:4px; font-size:12px; font-weight:bold;">BACA</span>
                        </a>`;
                });
            }
        }
    } catch (e) { console.error("Error Detail:", e); }
}

// --- LOAD VIEWER ---
async function loadViewer(id, chId) {
    const viewer = document.getElementById('manga-viewer');
    if (!viewer || !chId) return;

    try {
        const snap = await getDoc(doc(db, "chapters", chId));
        if (snap.exists()) {
            const data = snap.data();
            const titleEl = document.getElementById('comic-title');
            if(titleEl) titleEl.innerText = data.chapterTitle;

            const images = data.images || [];
            viewer.innerHTML = images.map(img => `
                <img src="${img}" class="manga-page" style="width:100%; display:block; margin-bottom:2px;">
            `).join('');
        }
    } catch (e) { console.error("Error Viewer:", e); }
}

// --- LOAD PROFILE ---
async function loadProfile(uid) {
    const container = document.getElementById('profile-content');
    if (!container || !uid) return;

    try {
        const snap = await getDoc(doc(db, "users", uid));
        const data = snap.exists() ? snap.data() : null;
        const isOwner = auth.currentUser?.uid === uid;

        container.innerHTML = `
            <div style="text-align:center; color:white; padding:20px;">
                <img src="${data?.photoURL || 'https://via.placeholder.com/100'}" style="width:100px; height:100px; border-radius:50%; border:3px solid #00ff88; object-fit:cover;">
                <h2 style="margin:15px 0 5px 0;">${data?.displayName || 'User'}</h2>
                <p style="background:#161a21; padding:15px; border-radius:10px; color:#8b949e; font-size:14px;">
                    ${data?.bio || "Halo! Saya pembaca di DebutCMC."}
                </p>
                ${isOwner ? `
                    <button onclick="location.href='dashboard.html'" style="background:#00ff88; border:none; padding:12px 20px; border-radius:8px; font-weight:bold; cursor:pointer; width:100%; margin-top:10px;">
                        <i class="fa-solid fa-gauge"></i> DASHBOARD AUTHOR
                    </button>
                ` : ''}
            </div>`;
    } catch (e) { console.error("Error Profile:", e); }
}
