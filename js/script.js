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

// --- 1. LOGIKA AUTH & SYNC ---
window.loginGoogle = async () => {
    try { 
        const result = await signInWithPopup(auth, provider);
        await syncUserData(result.user); // Simpan ke database setelah login
        location.reload(); 
    } catch (e) { 
        console.error("Login Gagal:", e); 
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
            role: "reader", // Default role
            joinedAt: serverTimestamp()
        });
    }
}

// --- 2. ROUTING OTOMATIS ---
onAuthStateChanged(auth, async (user) => {
    // Tampilkan Avatar di Navbar
    const section = document.getElementById('auth-section');
    if (section) {
        section.innerHTML = user ? 
            `<img src="${user.photoURL}" onclick="location.href='profile.html?uid=${user.uid}'" style="width:35px; height:35px; border-radius:50%; border:2px solid #00ff88; cursor:pointer; object-fit:cover;">` :
            `<button onclick="loginGoogle()" style="background:#00ff88; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;">LOGIN</button>`;
    }

    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const ch = urlParams.get('ch');
    const uid = urlParams.get('uid');

    if (path.includes('index.html') || path.endsWith('/')) loadHome();
    else if (path.includes('detail.html')) loadDetail(id);
    else if (path.includes('viewer.html') || path.includes('reader.html')) loadViewer(id, ch);
    else if (path.includes('profile.html')) loadProfile(uid || user?.uid);
});

// --- 3. LOAD HOME ---
async function loadHome() {
    const grid = document.getElementById('comic-list');
    if (!grid) return;

    try {
        const q = query(collection(db, "comics"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        grid.innerHTML = "";

        if (snap.empty) {
            grid.innerHTML = "<p style='grid-column:1/-1; text-align:center; color:gray;'>Belum ada komik tersedia.</p>";
            return;
        }

        snap.forEach(d => {
            const data = d.data();
            grid.innerHTML += `
                <a href="detail.html?id=${d.id}" class="comic-card">
                    <div class="img-container">
                        <img src="${data.coverUrl}" loading="lazy">
                        <span class="card-tag">${data.statusSeries || 'NEW'}</span>
                    </div>
                    <div class="comic-title">${data.title}</div>
                    <div class="comic-meta">${data.genre || 'Manga'}</div>
                </a>`;
        });
    } catch (e) { console.error("Error Home:", e); }
}

// --- 4. LOAD DETAIL ---
async function loadDetail(id) {
    if (!id) return;
    try {
        const snap = await getDoc(doc(db, "comics", id));
        if (snap.exists()) {
            const data = snap.data();
            document.title = `${data.title} | DebutCMC`;
            
            // Mapping elemen UI
            const el = {
                title: document.getElementById('comic-title'),
                genre: document.getElementById('comic-genre'),
                cover: document.getElementById('comic-cover'),
                summary: document.getElementById('comic-summary')
            };

            if (el.title) el.title.innerText = data.title;
            if (el.genre) el.genre.innerText = data.genre;
            if (el.cover) el.cover.src = data.coverUrl;
            if (el.summary) el.summary.innerText = data.summary || "Sinopsis belum tersedia.";

            // Load Chapters
            const qCh = query(collection(db, "chapters"), where("comicId", "==", id), orderBy("createdAt", "desc"));
            const cSnap = await getDocs(qCh);
            const container = document.getElementById('chapters-container');
            
            if (container) {
                container.innerHTML = cSnap.empty ? "<p style='color:gray; padding:20px;'>Belum ada chapter.</p>" : "";
                cSnap.forEach(c => {
                    const ch = c.data();
                    const date = ch.createdAt?.toDate() ? ch.createdAt.toDate().toLocaleDateString('id-ID') : "Baru saja";
                    container.innerHTML += `
                        <a href="viewer.html?id=${id}&ch=${c.id}" class="chapter-item">
                            <div>
                                <span>${ch.chapterTitle}</span>
                                <small>${date}</small>
                            </div>
                            <span class="btn-read">BACA</span>
                        </a>`;
                });
            }
        }
    } catch (e) { console.error("Error Detail:", e); }
}

// --- 5. LOAD VIEWER ---
async function loadViewer(id, chId) {
    const viewer = document.getElementById('manga-viewer');
    const titleDisplay = document.getElementById('chapter-title-display');
    if (!viewer || !chId) return;

    try {
        const snap = await getDoc(doc(db, "chapters", chId));
        if (snap.exists()) {
            const data = snap.data();
            if (titleDisplay) titleDisplay.innerText = data.chapterTitle;

            const images = data.images || [];
            viewer.innerHTML = images.map(img => `
                <img src="${img}" class="manga-page" loading="lazy" 
                     onerror="this.src='https://via.placeholder.com/800x1200?text=Gagal+Memuat'">
            `).join('');
            
            // Auto scroll ke atas saat ganti chapter
            window.scrollTo(0,0);
        }
    } catch (e) { console.error("Error Viewer:", e); }
}

// --- 6. LOAD PROFILE ---
async function loadProfile(uid) {
    const container = document.getElementById('profile-content');
    if (!container || !uid) return;

    try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!snap.exists()) return;
        
        const data = snap.data();
        const isOwner = auth.currentUser?.uid === uid;

        container.innerHTML = `
            <div class="profile-header">
                <img src="${data.photoURL}" class="profile-avatar">
                <h2>${data.displayName}</h2>
                <p class="uid-tag">ID: ${uid.substring(0,8)}</p>
                
                <div class="bio-box">
                    <label>BIO</label>
                    <p>${data.bio || "Belum ada bio."}</p>
                </div>

                ${isOwner ? `
                    <div class="profile-actions">
                        <button onclick="location.href='dashboard.html'" class="btn-dash">DASHBOARD KREATOR</button>
                        <button onclick="auth.signOut().then(()=>location.href='index.html')" class="btn-logout">LOGOUT</button>
                    </div>
                ` : ''}
            </div>`;
    } catch (e) { console.error("Error Profile:", e); }
}
