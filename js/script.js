import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, orderBy 
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

// --- A. AUTH & OBSERVER ---
window.loginGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
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
        if (window.location.pathname.includes('dashboard.html')) {
            if(dashboardUI) dashboardUI.style.display = 'none';
            if(authOverlay) authOverlay.style.display = 'block';
        }
    }
});

// --- B. LOGIKA PROFIL (Bio & Dev Mode) ---
async function muatProfil() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('uid');
    const profileDiv = document.getElementById('profile-content');
    if (!profileDiv || !userId) return;

    const userSnap = await getDoc(doc(db, "users", userId));
    if (userSnap.exists()) {
        const data = userSnap.data();
        const isOwner = auth.currentUser && auth.currentUser.uid === userId;

        profileDiv.innerHTML = `
            <div style="text-align:center; color:white; font-family:sans-serif;">
                <img src="${data.photoURL}" style="width:100px; border-radius:50%; border:3px solid #00ff88;">
                <h2>${data.displayName}</h2>
                <p style="color:#8b949e;">@${data.username}</p>
                <p id="bio-text" style="background:#161a21; padding:15px; border-radius:10px;">${data.bio}</p>
                ${isOwner ? `
                    <button onclick="editBio()" style="background:none; border:1px solid #333; color:#8b949e; padding:5px 10px; cursor:pointer; margin-bottom:20px;">Edit Bio</button>
                    <hr style="border:0; border-top:1px solid #222; margin:20px 0;">
                    ${!data.isAuthor ? `
                        <div style="background:#00ff8811; border:1px solid #00ff88; padding:20px; border-radius:10px;">
                            <p>Ingin membuat komik sendiri?</p>
                            <button onclick="aktifkanDev()" style="background:#00ff88; color:black; border:none; padding:10px 20px; font-weight:bold; cursor:pointer; border-radius:5px;">AKTIFKAN MODE AUTHOR</button>
                        </div>
                    ` : `
                        <button onclick="window.location.href='dashboard.html'" style="background:#00ff88; color:black; border:none; width:100%; padding:15px; font-weight:bold; cursor:pointer; border-radius:5px;">MASUK DASHBOARD CREATOR 🚀</button>
                    `}
                ` : ""}
            </div>`;
    }
}

window.editBio = async () => {
    const newBio = prompt("Tulis bio baru kamu:");
    if (newBio) {
        await setDoc(doc(db, "users", auth.currentUser.uid), { bio: newBio }, { merge: true });
        location.reload();
    }
};

window.aktifkanDev = async () => {
    if (confirm("Aktifkan Mode Author untuk mulai mengunggah komik?")) {
        await setDoc(doc(db, "users", auth.currentUser.uid), { isAuthor: true }, { merge: true });
        alert("Selamat! Mode Author Aktif.");
        location.reload();
    }
};

// --- C. LOGIKA DASHBOARD (Upload & Create Series) ---
const btnCreate = document.getElementById('btn-create-series');
const fileInput = document.getElementById('file-input');
const uploadTrigger = document.getElementById('upload-trigger');

if (uploadTrigger && fileInput) {
    uploadTrigger.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        if(fileInput.files[0]) uploadTrigger.innerHTML = `<p style="color:#00ff88">📸 ${fileInput.files[0].name} terpilih!</p>`;
    });
}

if (btnCreate) {
    btnCreate.addEventListener('click', async () => {
        const title = document.getElementById('comic-title').value;
        const genre = document.getElementById('comic-genre').value;
        const summary = document.getElementById('comic-summary').value;
        const file = fileInput.files[0];
        const statusText = document.getElementById('upload-status');

        if (!file || !title || !summary) {
            alert("Harap lengkapi semua data (Judul, Summary, dan Cover)!");
            return;
        }

        btnCreate.disabled = true;
        btnCreate.innerText = "Processing...";
        statusText.innerText = "🚀 Mengirim ke ImgBB...";

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('https://api.imgbb.com/1/upload?key=daa2bcb021279c96cebd854f8650d77e', {
                method: 'POST',
                body: formData
            });
            const dataImg = await res.json();

            if (dataImg.status === 200) {
                statusText.innerText = "✅ Cover terupload! Menyimpan data...";

                await addDoc(collection(db, "comics"), {
                    title: title,
                    genre: genre,
                    summary: summary,
                    coverUrl: dataImg.data.url,
                    authorId: auth.currentUser.uid,
                    authorName: auth.currentUser.displayName,
                    createdAt: serverTimestamp(),
                    viewCount: 0,
                    rating: 0
                });

                alert("BERHASIL! Seri komik kamu resmi terbit.");
                window.location.href = "index.html"; 
            }
        } catch (error) {
            console.error(error);
            alert("Gagal mengunggah.");
        } finally {
            btnCreate.disabled = false;
            btnCreate.innerText = "Create Series >";
        }
    });
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
                <div style="display:flex; justify-content:space-between; align-items:center; background:#161a21; padding:10px; margin-bottom:8px; border-radius:8px;">
                    <span style="color:white;">${data.title}</span>
                    <button onclick="hapusKomik('${d.id}')" style="background:#ff4444; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Hapus</button>
                </div>`;
        }
    });
}

window.hapusKomik = async (id) => {
    if (confirm("Hapus seri ini?")) {
        const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        await deleteDoc(doc(db, "comics", id));
        muatKomikSaya();
    }
};

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
                <div class="thumbnail">
                    <img src="${data.coverUrl}" style="width:100%; border-radius:10px;">
                </div>
                <h4 style="color:white; margin:10px 0 0 0;">${data.title}</h4>
                <p style="font-size:12px; color:#00ff88;">${data.genre}</p>
            </a>`;
    });
}

const btnLogout = document.getElementById('btn-logout');
if (btnLogout) btnLogout.addEventListener('click', () => signOut(auth).then(() => location.href="index.html"));

loadHome();
