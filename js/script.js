import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, orderBy, where, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- 1. CONFIG ---
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

// --- 2. AUTHENTICATION ---
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

        // Jalankan fungsi berdasarkan halaman
        if (comicId) { muatDataSeries(); muatDaftarChapter(); }
        if (userIdParam) muatProfil();
        if (window.location.pathname.includes('dashboard.html')) muatKomikSaya();
    } else {
        if (authSection) authSection.innerHTML = `<button onclick="loginGoogle()" style="background:#00ff88; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;">SIGN IN</button>`;
    }
});

// --- 3. BERANDA (OPTIMIZED & FAST) ---
async function loadHome() {
    const grid = document.getElementById('comic-list');
    if (!grid) return;

    grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:20px;">Memuat koleksi...</p>`;

    try {
        const q = query(collection(db, "comics"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        
        grid.innerHTML = "";
        let count = 0;

        snap.forEach(d => {
            const data = d.data();
            // Hanya tampilkan yang statusnya "published"
            if (data.status === "published") {
                count++;
                grid.innerHTML += `
                    <a href="detail.html?id=${d.id}" class="comic-card">
                        <img src="${data.coverUrl}" loading="lazy">
                        <h4 class="comic-title">${data.title}</h4>
                        <p style="color:#00ff88; font-size:12px; margin:5px 0;">${data.genre}</p>
                    </a>`;
            }
        });

        if (count === 0) grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#444;">Belum ada komik yang dipublish.</p>`;
    } catch (e) { grid.innerHTML = "Gagal memuat."; }
}

// --- 4. DASHBOARD & MANAGE ---
const btnCreate = document.getElementById('btn-create-series');
if (btnCreate) {
    btnCreate.onclick = async () => {
        const title = document.getElementById('comic-title').value;
        const genre = document.getElementById('comic-genre').value;
        const summary = document.getElementById('comic-summary').value;
        const file = document.getElementById('file-input').files[0];

        if (!title || !file) return alert("Judul dan Cover wajib diisi!");
        
        btnCreate.disabled = true;
        btnCreate.innerText = "Mengunggah...";

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('https://api.imgbb.com/1/upload?key=daa2bcb021279c96cebd854f8650d77e', { method: 'POST', body: formData });
            const img = await res.json();

            await addDoc(collection(db, "comics"), {
                title: title,
                genre: genre,
                summary: summary,
                coverUrl: img.data.url,
                authorId: auth.currentUser.uid,
                status: "pending", // Default pending (tidak muncul di depan)
                createdAt: serverTimestamp()
            });

            alert("Series berhasil dibuat! Silakan tambah chapter agar komik tampil di beranda.");
            location.reload();
        } catch (e) { alert("Gagal!"); btnCreate.disabled = false; }
    };
}

async function muatDaftarChapter() {
    const list = document.getElementById('chapter-list');
    if (!list) return;

    const q = query(collection(db, "chapters"), where("comicId", "==", comicId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    // AUTO-PUBLISH: Jika sudah ada minimal 1 chapter, set status komik jadi published
    if (!snap.empty) {
        await setDoc(doc(db, "comics", comicId), { status: "published" }, { merge: true });
    }

    list.innerHTML = "";
    snap.forEach(d => {
        const data = d.data();
        list.innerHTML += `
            <div style="background:#161a21; border:1px solid #333; padding:15px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div style="max-width:70%"><strong class="comic-title" style="margin:0">${data.chapterTitle}</strong></div>
                <button onclick="hapusChapter('${d.id}')" style="background:none; border:none; color:#ff4444; cursor:pointer;">Hapus</button>
            </div>`;
    });
}

// --- 5. PROFIL ---
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
                <p style="color:#8b949e;">@${data.username}</p>
                <p style="background:#161a21; padding:15px; border-radius:10px; word-break:break-word;">${data.bio}</p>
                ${isOwner ? `
                    <button onclick="editBio()" style="background:none; border:1px solid #333; color:#8b949e; padding:5px 15px; cursor:pointer; margin-bottom:10px;">Edit Bio</button>
                    <hr style="border:0; border-top:1px solid #222; margin:20px 0;">
                    ${!data.isAuthor ? `
                        <button onclick="aktifkanDev()" style="background:#00ff88; color:black; border:none; padding:10px 20px; font-weight:bold; cursor:pointer; border-radius:5px; width:100%;">AKTIFKAN MODE AUTHOR</button>
                    ` : `
                        <button onclick="window.location.href='dashboard.html'" style="background:#00ff88; color:black; border:none; width:100%; padding:15px; font-weight:bold; cursor:pointer; border-radius:5px;">MASUK DASHBOARD CREATOR 🚀</button>
                    `}
                ` : ""}
            </div>`;
    }
}

// --- GLOBAL FUNCTIONS ---
window.editBio = async () => {
    const bio = prompt("Masukkan Bio Baru:");
    if (bio) { await setDoc(doc(db, "users", auth.currentUser.uid), { bio: bio }, { merge: true }); location.reload(); }
};

window.aktifkanDev = async () => {
    if (confirm("Mulai jadi Author?")) { await setDoc(doc(db, "users", auth.currentUser.uid), { isAuthor: true }, { merge: true }); location.reload(); }
};

window.hapusChapter = async (id) => {
    if (confirm("Hapus chapter ini?")) { await deleteDoc(doc(db, "chapters", id)); muatDaftarChapter(); }
};

// Jalankan load beranda di awal
loadHome();
