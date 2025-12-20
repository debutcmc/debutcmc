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
        if (window.location.pathname.includes('index.html')) location.reload();
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

        if (comicId) { muatDataSeries(); muatDaftarChapter(); }
        if (userIdParam) muatProfil();
        if (window.location.pathname.includes('dashboard.html')) muatKomikSaya();
    } else {
        if (authSection) authSection.innerHTML = `<button onclick="loginGoogle()" style="background:#00ff88; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;">SIGN IN</button>`;
    }
});

// --- LOGIKA CREATE SERIES (PENDING BY DEFAULT) ---
const btnCreate = document.getElementById('btn-create-series');
if (btnCreate) {
    btnCreate.addEventListener('click', async () => {
        const title = document.getElementById('comic-title').value;
        const genre = document.getElementById('comic-genre').value;
        const summary = document.getElementById('comic-summary').value;
        const fileInput = document.getElementById('file-input');
        
        if (!fileInput.files[0] || !title) return alert("Lengkapi data!");

        btnCreate.disabled = true;
        btnCreate.innerText = "Processing...";

        const formData = new FormData();
        formData.append('image', fileInput.files[0]);

        try {
            const res = await fetch('https://api.imgbb.com/1/upload?key=daa2bcb021279c96cebd854f8650d77e', { method: 'POST', body: formData });
            const img = await res.json();

            await addDoc(collection(db, "comics"), {
                title: title,
                genre: genre,
                summary: summary,
                coverUrl: img.data.url,
                authorId: auth.currentUser.uid,
                status: "pending", // TIDAK LANGSUNG PUBLISH
                createdAt: serverTimestamp()
            });

            alert("Berhasil dibuat! Status: Menunggu Chapter/Persetujuan Admin agar muncul di beranda.");
            location.reload();
        } catch (e) { alert("Gagal!"); btnCreate.disabled = false; }
    });
}

// --- LOGIKA BERANDA (HANYA TAMPILKAN YANG APPROVED) ---
async function loadHome() {
    const grid = document.getElementById('comic-list');
    if (!grid) return;
    
    // Hanya ambil yang statusnya "published"
    const q = query(collection(db, "comics"), where("status", "==", "published"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    
    grid.innerHTML = (snap.empty) ? "<p style='color:#444;'>Belum ada komik yang dipublish.</p>" : "";
    
    snap.forEach(d => {
        const data = d.data();
        grid.innerHTML += `
            <a href="detail.html?id=${d.id}" class="comic-card">
                <img src="${data.coverUrl}">
                <h4 class="comic-title">${data.title}</h4>
                <p style="color:#00ff88; font-size:11px; margin:2px 0;">${data.genre}</p>
            </a>`;
    });
}

// --- LOGIKA MANAGE CHAPTER ---
async function muatDaftarChapter() {
    const list = document.getElementById('chapter-list');
    if (!list) return;
    const q = query(collection(db, "chapters"), where("comicId", "==", comicId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    
    // Jika ada chapter, update status komik jadi published otomatis
    if (!snap.empty) {
        await setDoc(doc(db, "comics", comicId), { status: "published" }, { merge: true });
    }

    list.innerHTML = "";
    snap.forEach(d => {
        const data = d.data();
        list.innerHTML += `<div style="background:#161a21; border:1px solid #333; padding:15px; border-radius:10px; display:flex; justify-content:space-between; margin-bottom:10px;">
            <div style="max-width:70%"><strong class="comic-title" style="margin:0">${data.chapterTitle}</strong></div>
            <button onclick="hapusChapter('${d.id}')" style="color:#ff4444; background:none; border:none; cursor:pointer;">Hapus</button>
        </div>`;
    });
}

// --- FUNGSI SISANYA (PROFIL & DASHBOARD) ---
async function muatProfil() {
    const div = document.getElementById('profile-content');
    if (!div) return;
    const snap = await getDoc(doc(db, "users", userIdParam));
    if (snap.exists()) {
        const data = snap.data();
        const isOwner = auth.currentUser?.uid === userIdParam;
        div.innerHTML = `<div style="text-align:center; color:white;">
            <img src="${data.photoURL}" style="width:100px; border-radius:50%; border:3px solid #00ff88;">
            <h2>${data.displayName}</h2>
            <p style="background:#161a21; padding:15px; border-radius:10px; word-break:break-word;">${data.bio}</p>
            ${isOwner ? `<button onclick="editBio()">Edit Bio</button><hr>${!data.isAuthor ? `<button onclick="aktifkanDev()">AKTIFKAN AUTHOR</button>` : `<button onclick="location.href='dashboard.html'">DASHBOARD CREATOR</button>`}` : ""}
        </div>`;
    }
}

async function muatKomikSaya() {
    const list = document.getElementById('my-comic-list');
    if (!list) return;
    const q = query(collection(db, "comics"), where("authorId", "==", auth.currentUser.uid), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    list.innerHTML = "";
    snap.forEach(d => {
        const data = d.data();
        list.innerHTML += `<div style="background:#161a21; border:1px solid #333; padding:10px; border-radius:10px; display:flex; align-items:center; gap:10px; margin-bottom:10px;">
            <img src="${data.coverUrl}" style="width:50px; aspect-ratio:2/3; object-fit:cover; border-radius:4px;">
            <div style="flex-grow:1;"><h4 class="comic-title">${data.title}</h4><small style="color:${data.status === 'published' ? '#00ff88' : '#ffcc00'}">${data.status.toUpperCase()}</small></div>
            <button onclick="location.href='manage.html?id=${d.id}'">Manage</button>
        </div>`;
    });
}

window.editBio = async () => { /* ... logika edit bio ... */ };
window.aktifkanDev = async () => { /* ... logika aktifkan dev ... */ };
window.hapusChapter = async (id) => { if(confirm("Hapus?")) { await deleteDoc(doc(db, "chapters", id)); muatDaftarChapter(); } };

loadHome();
