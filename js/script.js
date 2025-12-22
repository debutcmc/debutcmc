import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getFirestore, collection, doc, getDoc, getDocs, setDoc, query, orderBy, where, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { 
    getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// --- 1. KONFIGURASI FIREBASE ---
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

const PLACEHOLDER_IMAGE = 'https://placehold.co/300x400/161a21/00ff88?text=No+Cover';

// --- 2. LOGIKA AUTH ---
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

// --- 3. ROUTING & OBSERVER ---
onAuthStateChanged(auth, async (user) => {
    const section = document.getElementById('auth-section');
    if (section) {
        section.innerHTML = user ? 
            `<img src="${user.photoURL}" onclick="location.href='profile.html?uid=${user.uid}'" style="width:35px; height:35px; border-radius:50%; border:2px solid #00ff88; cursor:pointer; object-fit:cover;">` :
            `<button onclick="loginGoogle()" class="btn-login" style="background:#00ff88; color:black; border:none; padding:6px 15px; border-radius:5px; font-weight:bold; cursor:pointer;">SIGN IN</button>`;
    }

    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const ch = urlParams.get('ch');
    const uid = urlParams.get('uid');

    // Cek route
    if (path === '/' || path.endsWith('index.html') || path.endsWith('/')) {
        loadHome();
    } else if (path.includes('detail.html')) {
        loadDetail(id);
    } else if (path.includes('viewer.html') || path.includes('reader.html')) {
        loadViewer(id, ch);
    } else if (path.includes('profile.html')) {
        loadProfile(uid || user?.uid);
    }
});

// --- 4. LOAD HOME (EDITED: PRO LOOK) ---
async function loadHome() {
    const grid = document.getElementById('comic-list');
    if (!grid) return;

    try {
        const q = query(collection(db, "comics"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        grid.innerHTML = "";

        if (snap.empty) {
            grid.innerHTML = "<p style='grid-column: 1/-1; text-align:center; padding:50px; color:#8b949e;'>Belum ada komik tersedia.</p>";
            return;
        }

        snap.forEach(d => {
            const data = d.data();
            const coverImg = data.coverUrl || data.cover || PLACEHOLDER_IMAGE;
            const title = data.title || "Untitled";
            
            // Tampilan diperbarui: Tulisan lebih besar, layout lebih rapi
            grid.innerHTML += `
                <a href="detail.html?id=${d.id}" class="comic-card" style="text-decoration:none;">
                    <div class="img-container" style="position:relative; width:100%; aspect-ratio:3/4; border-radius:12px; overflow:hidden; border:1px solid #2d333b;">
                        <img src="${coverImg}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'" style="width:100%; height:100%; object-fit:cover;">
                        <span class="card-tag" style="position:absolute; bottom:10px; left:10px; background:#00ff88; color:black; font-size:10px; font-weight:bold; padding:3px 8px; border-radius:4px; text-transform:uppercase;">
                            ${data.statusSeries || 'NEW'}
                        </span>
                    </div>
                    <div class="comic-info" style="padding:10px 5px;">
                        <div class="comic-title" style="color:white; font-size:18px; font-weight:bold; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${title}
                        </div>
                        <div class="comic-meta" style="color:#8b949e; font-size:14px; font-weight:500;">
                            <span style="color:#00ff88;">${data.genre || 'Genre'}</span> • Chapter ${data.lastChapter || '1'}
                        </div>
                    </div>
                </a>`;
        });
    } catch (e) { 
        console.error("Error Home:", e);
        grid.innerHTML = `<p style="grid-column: 1/-1; color:#ff4444; text-align:center;">Gagal memuat data.</p>`;
    }
}

// --- 5. LOAD DETAIL ---
async function loadDetail(id) {
    if (!id) return;
    try {
        const snap = await getDoc(doc(db, "comics", id));
        if (snap.exists()) {
            const data = snap.data();
            document.title = `${data.title} | DebutCMC`;
            
            const elements = {
                'comic-title': data.title,
                'comic-genre': data.genre,
                'comic-summary': data.summary || "Sinopsis belum tersedia."
            };

            for (let [elId, val] of Object.entries(elements)) {
                const el = document.getElementById(elId);
                if (el) el.innerText = val;
            }

            const elCover = document.getElementById('comic-cover');
            if (elCover) elCover.src = data.coverUrl || data.cover || PLACEHOLDER_IMAGE;

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

// --- 6. LOAD VIEWER ---
async function loadViewer(id, chId) {
    const viewer = document.getElementById('manga-viewer');
    const titleDisplay = document.getElementById('chapter-title-display');
    if (!viewer || !chId) return;

    viewer.innerHTML = "<div class='loading-box' style='text-align:center; padding:100px; color:#00ff88;'>Memuat halaman...</div>";

    try {
        const snap = await getDoc(doc(db, "chapters", chId));
        if (snap.exists()) {
            const data = snap.data();
            if (titleDisplay) titleDisplay.innerText = data.chapterTitle;

            const images = data.images || [];
            if (images.length === 0) {
                viewer.innerHTML = "<p style='text-align:center;'>Tidak ada gambar di chapter ini.</p>";
                return;
            }

            viewer.innerHTML = images.map(img => `
                <img src="${img}" class="manga-page" loading="lazy" 
                     style="width:100%; max-width:800px; display:block; margin:0 auto;"
                     onerror="this.src='https://placehold.co/800x1200?text=Gambar+Rusak'">
            `).join('');
            
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    } catch (e) { 
        console.error("Error Viewer:", e);
        viewer.innerHTML = "<p style='text-align:center; color:red;'>Gagal memuat chapter.</p>";
    }
}

// --- 7. LOAD PROFILE ---
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
                <img src="${data.photoURL || 'https://via.placeholder.com/100'}" class="profile-avatar" style="width:100px; height:100px; border-radius:50%; border:3px solid #00ff88; margin-bottom:15px;">
                <h2 style="margin-bottom:5px;">${data.displayName || 'User'}</h2>
                <p style="color:#8b949e; font-size:12px; margin-bottom:20px;">UID: ${uid.substring(0,8)}</p>
                
                <div class="bio-box" style="background:#161a21; padding:20px; border-radius:12px; border:1px solid #2d333b; text-align:left; max-width:400px; margin: 0 auto 25px;">
                    <label style="color:#00ff88; font-size:10px; font-weight:800; text-transform:uppercase;">Biografi</label>
                    <p style="margin-top:5px; font-size:14px;">${data.bio || "Halo! Saya pembaca di DebutCMC."}</p>
                </div>

                ${isOwner ? `
                    <div class="profile-actions" style="display:flex; gap:10px; justify-content:center;">
                        <button onclick="location.href='dashboard.html'" class="btn-dash" style="background:#00ff88; color:#0b0e14; border:none; padding:12px 25px; border-radius:8px; font-weight:bold; cursor:pointer;">DASHBOARD</button>
                        <button onclick="auth.signOut().then(()=>location.reload())" class="btn-logout" style="background:#2d333b; color:#ff4444; border:1px solid #ff444433; padding:12px 25px; border-radius:8px; font-weight:bold; cursor:pointer;">LOGOUT</button>
                    </div>
                ` : ''}
            </div>`;
    } catch (e) { console.error("Error Profile:", e); }
}
