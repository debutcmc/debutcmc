import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getFirestore, collection, doc, getDoc, getDocs, setDoc, query, orderBy, where, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { 
    getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// --- KONFIGURASI FIREBASE ---
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

// Gambar cadangan jika coverUrl di database kosong atau rusak
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x400?text=No+Image';

// --- 1. LOGIKA AUTH & SYNC ---
window.loginGoogle = async () => {
    try { 
        const result = await signInWithPopup(auth, provider);
        await syncUserData(result.user);
        location.reload(); 
    } catch (e) { 
        console.error("Login Gagal:", e);
        alert("Gagal login: " + e.message);
    }
};

async function syncUserData(user) {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
        await setDoc(userRef, {
            displayName: user.displayName,
            photoURL: user.photoURL,
            email: user.email,
            bio: "Halo! Saya pembaca di DebutCMC.",
            role: "reader",
            joinedAt: serverTimestamp()
        });
    }
}

// --- 2. ROUTING OTOMATIS ---
onAuthStateChanged(auth, async (user) => {
    const section = document.getElementById('auth-section');
    if (section) {
        section.innerHTML = user ? 
            `<img src="${user.photoURL}" onclick="location.href='profile.html?uid=${user.uid}'" style="width:35px; height:35px; border-radius:50%; border:2px solid #00ff88; cursor:pointer; object-fit:cover;">` :
            `<button onclick="loginGoogle()" class="btn-login">SIGN IN</button>`;
    }

    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const ch = urlParams.get('ch');
    const uid = urlParams.get('uid');

    // Routing Logic
    if (path === '/' || path.includes('index.html')) loadHome();
    else if (path.includes('detail.html')) loadDetail(id);
    else if (path.includes('viewer.html') || path.includes('reader.html')) loadViewer(id, ch);
    else if (path.includes('profile.html')) loadProfile(uid || user?.uid);
});

// --- 3. LOAD HOME (DAFTAR KOMIK) ---
async function loadHome() {
    const grid = document.getElementById('comic-list');
    if (!grid) return;

    try {
        const q = query(collection(db, "comics"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        grid.innerHTML = "";

        if (snap.empty) {
            grid.innerHTML = "<p class='empty-msg'>Belum ada komik tersedia.</p>";
            return;
        }

        snap.forEach(d => {
            const data = d.data();
            // Perbaikan: Cek field 'coverUrl' atau 'cover' agar tidak broken
            const coverImg = data.coverUrl || data.cover || PLACEHOLDER_IMAGE;
            
            grid.innerHTML += `
                <a href="detail.html?id=${d.id}" class="comic-card">
                    <div class="img-container">
                        <img src="${coverImg}" 
                             loading="lazy" 
                             onerror="this.src='${PLACEHOLDER_IMAGE}'">
                        <span class="card-tag">${data.statusSeries || 'NEW'}</span>
                    </div>
                    <div class="comic-title">${data.title || 'Untitled'}</div>
                    <div class="comic-meta">${data.genre || 'Action'}</div>
                </a>`;
        });
    } catch (e) { 
        console.error("Error Home:", e);
        grid.innerHTML = `<p style="color:red;">Error: Gagal memuat data.</p>`;
    }
}

// --- 4. LOAD DETAIL ---
async function loadDetail(id) {
    if (!id) return;
    try {
        const snap = await getDoc(doc(db, "comics", id));
        if (snap.exists()) {
            const data = snap.data();
            document.title = `${data.title} | DebutCMC`;
            
            const elTitle = document.getElementById('comic-title');
            const elCover = document.getElementById('comic-cover');
            const elGenre = document.getElementById('comic-genre');
            const elSummary = document.getElementById('comic-summary');

            if (elTitle) elTitle.innerText = data.title;
            if (elGenre) elGenre.innerText = data.genre;
            if (elCover) elCover.src = data.coverUrl || data.cover || PLACEHOLDER_IMAGE;
            if (elSummary) elSummary.innerText = data.summary || "Sinopsis belum tersedia.";

            // Load Chapters
            const qCh = query(collection(db, "chapters"), where("comicId", "==", id), orderBy("createdAt", "desc"));
            const cSnap = await getDocs(qCh);
            const container = document.getElementById('chapters-container');
            
            if (container) {
                container.innerHTML = cSnap.empty ? "<p style='color:gray; padding:20px;'>Belum ada chapter.</p>" : "";
                cSnap.forEach(c => {
                    const ch = c.data();
                    const date = ch.createdAt?.toDate() ? ch.createdAt.toDate().toLocaleDateString('id-ID') : "Baru";
                    container.innerHTML += `
                        <a href="viewer.html?id=${id}&ch=${c.id}" class="chapter-item">
                            <div class="ch-info">
                                <span>${ch.chapterTitle || 'Chapter Baru'}</span>
                                <small>${date}</small>
                            </div>
                            <span class="btn-read">BACA</span>
                        </a>`;
                });
            }
        }
    } catch (e) { console.error("Error Detail:", e); }
}

// --- 5. LOAD VIEWER (READER) ---
async function loadViewer(id, chId) {
    const viewer = document.getElementById('manga-viewer');
    const titleDisplay = document.getElementById('chapter-title-display');
    if (!viewer || !chId) return;

    viewer.innerHTML = "<p>Memuat halaman...</p>";

    try {
        const snap = await getDoc(doc(db, "chapters", chId));
        if (snap.exists()) {
            const data = snap.data();
            if (titleDisplay) titleDisplay.innerText = data.chapterTitle;

            const images = data.images || [];
            if (images.length === 0) {
                viewer.innerHTML = "<p>Tidak ada gambar di chapter ini.</p>";
                return;
            }

            viewer.innerHTML = images.map(img => `
                <img src="${img}" class="manga-page" loading="lazy" 
                     onerror="this.src='https://via.placeholder.com/800x1200?text=Gambar+Rusak'">
            `).join('');
            
            window.scrollTo(0,0);
        }
    } catch (e) { 
        console.error("Error Viewer:", e);
        viewer.innerHTML = "<p>Gagal memuat chapter.</p>";
    }
}

// --- 6. LOAD PROFILE ---
async function loadProfile(uid) {
    const container = document.getElementById('profile-content');
    if (!container || !uid) return;

    try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!snap.exists()) {
            container.innerHTML = "<p>User tidak ditemukan.</p>";
            return;
        }
        
        const data = snap.data();
        const isOwner = auth.currentUser?.uid === uid;

        container.innerHTML = `
            <div class="profile-header">
                <img src="${data.photoURL || 'https://via.placeholder.com/100'}" class="profile-avatar">
                <h2>${data.displayName || 'User'}</h2>
                <p class="uid-tag">ID: ${uid.substring(0,8)}</p>
                
                <div class="bio-box">
                    <label>BIO</label>
                    <p>${data.bio || "Halo! Saya pembaca di DebutCMC."}</p>
                </div>

                ${isOwner ? `
                    <div class="profile-actions">
                        <button onclick="location.href='dashboard.html'" class="btn-dash">DASHBOARD</button>
                        <button onclick="auth.signOut().then(()=>location.reload())" class="btn-logout">LOGOUT</button>
                    </div>
                ` : ''}
            </div>`;
    } catch (e) { console.error("Error Profile:", e); }
}
