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

// Parameter URL (untuk Manage Chapter)
const urlParams = new URLSearchParams(window.location.search);
const comicId = urlParams.get('id');

// --- A. AUTH & OBSERVER ---
window.loginGoogle = async () => {
    try {
        await signInWithPopup(auth, provider);
        if (window.location.pathname.includes('index.html')) {
            window.location.href = "index.html";
        }
    } catch (error) { console.error(error); }
};

onAuthStateChanged(auth, async (user) => {
    const authSection = document.getElementById('auth-section');
    const dashboardUI = document.getElementById('dashboard-ui');
    const authOverlay = document.getElementById('auth-overlay');

    if (user) {
        // --- LOGIKA USER DATA ---
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        let userData = userSnap.data();

        if (!userSnap.exists()) {
            userData = {
                displayName: user.displayName,
                photoURL: user.photoURL,
                email: user.email,
                uid: user.uid,
                username: user.email.split('@')[0],
                bio: "Member Baru DebutCMC",
                isAuthor: false
            };
            await setDoc(userRef, userData);
        }

        // Tampilkan Info User di Header
        if (authSection) {
            const userPhoto = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=00ff88&color=0b0e14`;
            authSection.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="text-align:right; font-family:sans-serif;">
                        <span style="display:block; font-size:10px; color:#00ff88; font-weight:bold;">${userData.isAuthor ? 'AUTHOR' : 'MEMBER'}</span>
                        <span style="display:block; font-size:12px; color:white;">${user.displayName.split(' ')[0]}</span>
                    </div>
                    <img src="${userPhoto}" onclick="window.location.href='profile.html?uid=${user.uid}'" style="width:35px; height:35px; border-radius:50%; border:2px solid #00ff88; cursor:pointer;">
                </div>`;
        }

        // --- CEK HALAMAN MANAGE (Baru) ---
        if (comicId) {
            muatDataSeries();
            muatDaftarChapter();
        }

        // --- CEK DASHBOARD ---
        if (window.location.pathname.includes('dashboard.html')) {
            if (userData.isAuthor) {
                if(dashboardUI) dashboardUI.style.display = 'block';
                if(authOverlay) authOverlay.style.display = 'none';
                muatKomikSaya();
            } else {
                alert("Akses Ditolak! Aktifkan Mode Author di Profil kamu dulu.");
                window.location.href = `profile.html?uid=${user.uid}`;
            }
        }
        muatProfil();
    } else {
        if (authSection) authSection.innerHTML = `<button onclick="loginGoogle()" style="background:#00ff88; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;">SIGN IN</button>`;
        if (comicId) window.location.href = 'index.html'; // Tendang jika akses manage tanpa login
    }
});

// --- B. LOGIKA MANAGE CHAPTER (FUNGSI BARU) ---
async function muatDataSeries() {
    const docRef = doc(db, "comics", comicId);
    const snap = await getDoc(docRef);
    if (snap.exists() && document.getElementById('manage-title')) {
        const data = snap.data();
        document.getElementById('manage-title').innerText = "Manage: " + data.title;
        document.getElementById('info-title').innerText = data.title;
        document.getElementById('info-genre').innerText = data.genre;
        document.getElementById('info-summary').innerText = data.summary;
        document.getElementById('series-cover').src = data.coverUrl;
    }
}

async function muatDaftarChapter() {
    const list = document.getElementById('chapter-list');
    if (!list) return;
    const q = query(collection(db, "chapters"), where("comicId", "==", comicId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    list.innerHTML = "";
    snap.forEach(d => {
        const data = d.data();
        list.innerHTML += `
            <div style="background:#161a21; border:1px solid #333; padding:15px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div>
                    <strong style="display:block; color:white;">${data.chapterTitle}</strong>
                    <small style="color:#8b949e;">${data.images.length} Halaman</small>
                </div>
                <button onclick="hapusChapter('${d.id}')" style="background:none; border:none; color:#ff4444; cursor:pointer; font-weight:bold;">Hapus</button>
            </div>`;
    });
}

window.hapusChapter = async (id) => {
    if(confirm("Hapus chapter ini?")) {
        await deleteDoc(doc(db, "chapters", id));
        muatDaftarChapter();
    }
};

// Logika Upload Chapter
const btnUploadChap = document.getElementById('btn-upload-chapter');
const chapFiles = document.getElementById('chapter-files');
if (btnUploadChap) {
    btnUploadChap.onclick = async () => {
        const title = document.getElementById('chapter-title').value;
        const files = chapFiles.files;
        if (!title || files.length === 0) return alert("Isi judul dan pilih gambar!");

        btnUploadChap.disabled = true;
        btnUploadChap.innerText = "Processing...";
        let uploadedUrls = [];

        try {
            for (let i = 0; i < files.length; i++) {
                btnUploadChap.innerText = `Uploading (${i + 1}/${files.length})...`;
                const formData = new FormData();
                formData.append('image', files[i]);
                const res = await fetch('https://api.imgbb.com/1/upload?key=daa2bcb021279c96cebd854f8650d77e', {
                    method: 'POST',
                    body: formData
                });
                const imgData = await res.json();
                uploadedUrls.push(imgData.data.url);
            }
            await addDoc(collection(db, "chapters"), {
                comicId: comicId,
                chapterTitle: title,
                images: uploadedUrls,
                createdAt: serverTimestamp()
            });
            alert("Chapter dipublish!");
            location.reload();
        } catch (e) {
            alert("Gagal upload.");
            btnUploadChap.disabled = false;
        }
    };
}

// --- C. LOGIKA PROFIL & DASHBOARD ---
async function muatProfil() {
    const urlParamsProfile = new URLSearchParams(window.location.search);
    const userId = urlParamsProfile.get('uid');
    const profileDiv = document.getElementById('profile-content');
    if (!profileDiv || !userId) return;

    const userSnap = await getDoc(doc(db, "users", userId));
    if (userSnap.exists()) {
        const data = userSnap.data();
        const isOwner = auth.currentUser && auth.currentUser.uid === userId;
        profileDiv.innerHTML = `
            <div style="text-align:center; color:white;">
                <img src="${data.photoURL}" style="width:100px; border-radius:50%; border:3px solid #00ff88;">
                <h2>${data.displayName}</h2>
                <p id="bio-text">${data.bio}</p>
                ${isOwner ? `<button onclick="editBio()">Edit Bio</button>` : ""}
            </div>`;
    }
}

async function muatKomikSaya() {
    const list = document.getElementById('my-comic-list');
    if (!list) return;
    const q = query(collection(db, "comics"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    list.innerHTML = "";
    snap.forEach(d => {
        const data = d.data();
        if (data.authorId === auth.currentUser.uid) {
            list.innerHTML += `
                <div style="background:#161a21; border:1px solid #333; border-radius:10px; display:flex; gap:15px; align-items:center; padding:10px; margin-bottom:10px;">
                    <img src="${data.coverUrl}" style="width:60px; height:60px; object-fit:cover; border-radius:5px;">
                    <div style="flex-grow:1;">
                        <h4 style="margin:0; color:white;">${data.title}</h4>
                    </div>
                    <button onclick="window.location.href='manage.html?id=${d.id}'" style="background:#333; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Edit</button>
                    <button onclick="hapusKomik('${d.id}')" style="background:#ff4444; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Hapus</button>
                </div>`;
        }
    });
}

// --- D. LOGIKA BERANDA ---
async function loadHome() {
    const grid = document.getElementById('comic-list');
    if (!grid) return;
    const q = query(collection(db, "comics"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    grid.innerHTML = "";
    snap.forEach(d => {
        const data = d.data();
        grid.innerHTML += `
            <a href="detail.html?id=${d.id}" class="comic-card">
                <img src="${data.coverUrl}" style="width:100%; border-radius:10px;">
                <h4 style="color:white; margin-top:10px;">${data.title}</h4>
            </a>`;
    });
}

const btnLogout = document.getElementById('btn-logout');
if (btnLogout) btnLogout.addEventListener('click', () => signOut(auth).then(() => location.href="index.html"));

loadHome();
