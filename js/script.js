import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
    try { await signInWithPopup(auth, provider); location.reload(); } 
    catch (e) { console.error(e); }
};

onAuthStateChanged(auth, async (user) => {
    const section = document.getElementById('auth-section');
    if (user && section) {
        section.innerHTML = `<img src="${user.photoURL}" onclick="location.href='profile.html?uid=${user.uid}'" style="width:35px; border-radius:50%; border:2px solid #00ff88; cursor:pointer;">`;
    }
    
    // Auto-run berdasarkan halaman
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    
    if (path.includes('index.html') || path === '/') loadHome();
    if (path.includes('detail.html')) loadDetail(urlParams.get('id'));
    if (path.includes('viewer.html')) loadViewer(urlParams.get('id'), urlParams.get('ch'));
    if (path.includes('profile.html')) loadProfile(urlParams.get('uid'));
});

// --- LOAD HOME ---
async function loadHome() {
    const grid = document.getElementById('comic-list');
    if (!grid) return;
    const q = query(collection(db, "comics"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    grid.innerHTML = "";
    snap.forEach(d => {
        const data = d.data();
        if (data.status === "published") {
            grid.innerHTML += `
                <a href="detail.html?id=${d.id}" class="comic-card">
                    <img src="${data.coverUrl}" loading="lazy">
                    <h4 class="comic-title">${data.title}</h4>
                    <p style="color:#00ff88; font-size:12px;">${data.genre}</p>
                </a>`;
        }
    });
}

// --- LOAD DETAIL ---
async function loadDetail(id) {
    if (!id) return;
    const snap = await getDoc(doc(db, "comics", id));
    if (snap.exists()) {
        const data = snap.data();
        document.getElementById('comic-title').innerText = data.title;
        document.getElementById('comic-genre').innerText = data.genre;
        document.getElementById('comic-cover').src = data.coverUrl;
        document.querySelector('.synopsis').innerText = data.summary || "Tidak ada sinopsis.";
        
        // Muat Chapter
        const cSnap = await getDocs(query(collection(db, "chapters"), where("comicId", "==", id), orderBy("createdAt", "asc")));
        const container = document.getElementById('chapters-container');
        container.innerHTML = "";
        cSnap.forEach((c, index) => {
            container.innerHTML += `
                <a href="viewer.html?id=${id}&ch=${c.id}" class="chapter-item">
                    <span>Chapter ${index + 1}: ${c.data().chapterTitle}</span>
                    <span class="btn-read">BACA</span>
                </a>`;
        });
    }
}

// --- LOAD VIEWER ---
async function loadViewer(id, chId) {
    const viewer = document.getElementById('manga-viewer');
    const snap = await getDoc(doc(db, "chapters", chId));
    if (snap.exists()) {
        document.getElementById('comic-title').innerText = snap.data().chapterTitle;
        const images = snap.data().images || [];
        viewer.innerHTML = images.map(img => `<img src="${img}" class="manga-page">`).join('');
    }
}

// --- LOAD PROFILE ---
async function loadProfile(uid) {
    const container = document.getElementById('profile-content');
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
        const data = snap.data();
        const isOwner = auth.currentUser?.uid === uid;
        container.innerHTML = `
            <div style="text-align:center; color:white;">
                <img src="${data.photoURL}" style="width:100px; border-radius:50%; border:3px solid #00ff88;">
                <h2>${data.displayName}</h2>
                <p style="background:#161a21; padding:15px; border-radius:10px;">${data.bio}</p>
                ${isOwner && data.isAuthor ? `<button onclick="location.href='dashboard.html'" style="background:#00ff88; border:none; padding:10px 20px; border-radius:5px; font-weight:bold; cursor:pointer; width:100%;">DASHBOARD AUTHOR</button>` : ''}
            </div>`;
    }
}
