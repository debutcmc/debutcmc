import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, orderBy, where, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

const urlParams = new URLSearchParams(window.location.search);
const comicId = urlParams.get('id');
const userIdParam = urlParams.get('uid');

// --- AUTH ---
window.loginGoogle = async () => {
    try {
        await signInWithPopup(auth, provider);
        location.reload();
    } catch (error) { console.error(error); }
};

const btnLogout = document.getElementById('btn-logout');
if (btnLogout) btnLogout.addEventListener('click', () => signOut(auth).then(() => location.href="index.html"));

onAuthStateChanged(auth, async (user) => {
    const authSection = document.getElementById('auth-section');
    if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        let userData = userSnap.data();

        if (!userSnap.exists()) {
            userData = { displayName: user.displayName, photoURL: user.photoURL, email: user.email, uid: user.uid, username: user.email.split('@')[0], bio: "Member Baru DebutCMC", isAuthor: false };
            await setDoc(userRef, userData);
        }

        if (authSection) {
            authSection.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="text-align:right;">
                        <span style="display:block; font-size:10px; color:#00ff88; font-weight:bold;">${userData.isAuthor ? 'AUTHOR' : 'MEMBER'}</span>
                        <span style="display:block; font-size:12px; color:white;">${user.displayName.split(' ')[0]}</span>
                    </div>
                    <img src="${user.photoURL}" onclick="window.location.href='profile.html?uid=${user.uid}'" style="width:35px; height:35px; border-radius:50%; border:2px solid #00ff88; cursor:pointer;">
                </div>`;
        }

        // AKTIFKAN FUNGSI SESUAI HALAMAN
        if (comicId) { muatDataSeries(); muatDaftarChapter(); }
        if (userIdParam) muatProfil();
        if (window.location.pathname.includes('dashboard.html')) muatKomikSaya();
    } else {
        if (authSection) authSection.innerHTML = `<button onclick="loginGoogle()" style="background:#00ff88; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;">SIGN IN</button>`;
    }
});

// --- DASHBOARD: MUAT KOMIK SAYA ---
async function muatKomikSaya() {
    const list = document.getElementById('my-comic-list');
    if (!list) return;
    
    // Tarik semua komik, lalu filter milik user ini saja
    const q = query(collection(db, "comics"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    list.innerHTML = "";
    
    let adaKomik = false;
    snap.forEach(d => {
        const data = d.data();
        if (data.authorId === auth.currentUser.uid) {
            adaKomik = true;
            list.innerHTML += `
                <div style="background:#161a21; border:1px solid #333; border-radius:10px; display:flex; gap:15px; align-items:center; padding:10px; margin-bottom:10px;">
                    <img src="${data.coverUrl}" style="width:50px; height:75px; object-fit:cover; border-radius:5px;">
                    <div style="flex-grow:1;">
                        <h4 class="comic-title" style="margin:0;">${data.title}</h4>
                        <small style="color:${data.status === 'published' ? '#00ff88' : '#ffcc00'}">${data.status.toUpperCase()}</small>
                    </div>
                    <button onclick="window.location.href='manage.html?id=${d.id}'" style="background:#333; color:white; border:none; padding:8px; border-radius:4px; cursor:pointer;">Manage</button>
                    <button onclick="hapusKomik('${d.id}')" style="background:#ff4444; color:white; border:none; padding:8px; border-radius:4px; cursor:pointer;">Hapus</button>
                </div>`;
        }
    });
    if (!adaKomik) list.innerHTML = "<p style='text-align:center; color:#8b949e;'>Belum ada komik buatanmu.</p>";
}

// --- MANAGE: MUAT DATA SERIES & CHAPTER ---
async function muatDataSeries() {
    const docRef = doc(db, "comics", comicId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data();
        if(document.getElementById('manage-title')) document.getElementById('manage-title').innerText = "Manage: " + data.title;
        if(document.getElementById('info-title')) document.getElementById('info-title').innerText = data.title;
        if(document.getElementById('info-genre')) document.getElementById('info-genre').innerText = data.genre;
        if(document.getElementById('series-cover')) document.getElementById('series-cover').src = data.coverUrl;
    }
}

async function muatDaftarChapter() {
    const list = document.getElementById('chapter-list');
    if (!list) return;
    const q = query(collection(db, "chapters"), where("comicId", "==", comicId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    
    // AUTO-PUBLISH jika ada chapter
    if (!snap.empty) { await setDoc(doc(db, "comics", comicId), { status: "published" }, { merge: true }); }

    list.innerHTML = "";
    snap.forEach(d => {
        const data = d.data();
        list.innerHTML += `
            <div style="background:#161a21; border:1px solid #333; padding:15px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div class="comic-title">${data.chapterTitle}</div>
                <button onclick="hapusChapter('${d.id}')" style="color:#ff4444; background:none; border:none; cursor:pointer;">Hapus</button>
            </div>`;
    });
}

// --- BERANDA: HANYA PUBLISHED ---
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
                    <p style="color:#00ff88; font-size:12px; margin:5px 0;">${data.genre}</p>
                </a>`;
        }
    });
}

// --- PROFIL ---
async function muatProfil() {
    const div = document.getElementById('profile-content');
    if (!div) return;
    const snap = await getDoc(doc(db, "users", userIdParam));
    if (snap.exists()) {
        const data = snap.data();
        const isOwner = auth.currentUser?.uid === userIdParam;
        div.innerHTML = `
            <div style="text-align:center; color:white;">
                <img src="${data.photoURL}" style="width:100px; border-radius:50%; border:3px solid #00ff88;">
                <h2>${data.displayName}</h2>
                <p style="background:#161a21; padding:15px; border-radius:10px; word-break:break-word;">${data.bio}</p>
                ${isOwner ? `<button onclick="editBio()">Edit Bio</button><hr>${!data.isAuthor ? `<button onclick="aktifkanDev()">AKTIFKAN AUTHOR</button>` : `<button onclick="location.href='dashboard.html'">DASHBOARD CREATOR</button>`}` : ""}
            </div>`;
    }
}

// --- GLOBAL WINDOW FUNCTIONS ---
window.hapusKomik = async (id) => { if(confirm("Hapus Series?")) { await deleteDoc(doc(db, "comics", id)); muatKomikSaya(); } };
window.hapusChapter = async (id) => { if(confirm("Hapus Chapter?")) { await deleteDoc(doc(db, "chapters", id)); muatDaftarChapter(); } };
window.editBio = async () => { /* ... logika edit bio ... */ };
window.aktifkanDev = async () => { /* ... logika aktifkan dev ... */ };

loadHome();
