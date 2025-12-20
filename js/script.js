// 1. IMPORT FIREBASE (Versi CDN Module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    serverTimestamp, 
    doc, 
    setDoc, 
    getDoc,
    getDocs,
    query,
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, 
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 2. CONFIG FIREBASE DEBUTCMC
const firebaseConfig = {
  apiKey: "AIzaSyCt2j9hATOmWYqdknCi05j8zIO59SaF578",
  authDomain: "debutcmc-ec2ad.firebaseapp.com",
  projectId: "debutcmc-ec2ad",
  storageBucket: "debutcmc-ec2ad.firebasestorage.app",
  messagingSenderId: "283108871954",
  appId: "1:283108871954:web:5900298201e74ce83d2dcb"
};

// 3. INISIALISASI FIREBASE
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- A. LOGIKA AUTH (LOGIN & OBSERVER) ---

// Fungsi Login Global
window.loginGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        console.log("User Logged In:", result.user);
    } catch (error) {
        console.error("Login Error:", error);
    }
};

// Simpan data user ke Database & Jalankan fungsi halaman
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
            displayName: user.displayName,
            photoURL: user.photoURL,
            email: user.email,
            uid: user.uid,
            username: user.email.split('@')[0],
            bio: "Member DebutCMC"
        }, { merge: true });
        
        // Cek halaman profil jika sedang dibuka
        muatProfil();
    }
});

// --- B. LOGIKA UPLOAD (IMGBB + FIREBASE) ---

const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-trigger');
const statusText = document.getElementById('upload-status');
const previewImg = document.getElementById('image-preview');

if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async function() {
        const file = this.files[0];
        const judulInput = document.getElementById('comic-title');
        const genreInput = document.getElementById('comic-genre');

        if (!file || !auth.currentUser) {
            if (!auth.currentUser) alert("Silakan login terlebih dahulu!");
            return;
        }

        if (judulInput && !judulInput.value) {
            alert("Harap isi Judul Komik terlebih dahulu!");
            this.value = ""; 
            return;
        }

        const formData = new FormData();
        formData.append('image', file);
        statusText.innerText = "🚀 Mengunggah gambar ke ImgBB...";
        uploadBtn.disabled = true;

        try {
            const response = await fetch('https://api.imgbb.com/1/upload?key=daa2bcb021279c96cebd854f8650d77e', {
                method: 'POST',
                body: formData
            });
            const hasil = await response.json();

            if (hasil.status === 200) {
                const linkGambar = hasil.data.url;
                statusText.innerText = "✅ Gambar aman! Mendaftarkan ke Database...";

                await addDoc(collection(db, "comics"), {
                    title: judulInput ? judulInput.value : "Tanpa Judul",
                    genre: genreInput ? genreInput.value : "Umum",
                    coverUrl: linkGambar,
                    authorId: auth.currentUser.uid,
                    createdAt: serverTimestamp()
                });

                statusText.innerHTML = `🔥 BERHASIL DIRILIS!`;
                previewImg.src = hasil.data.display_url;
                previewImg.style.display = 'block';
                if(judulInput) judulInput.value = "";
            }
        } catch (error) {
            statusText.innerText = "❌ Kesalahan sistem!";
            console.error(error);
        } finally {
            uploadBtn.disabled = false;
        }
    });
}

// --- C. FUNGSI TAMPIL PROFIL (DINAMIS) ---

async function muatProfil() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('uid'); 
    const profileDiv = document.getElementById('profile-content');
    
    if (!profileDiv || !userId) return;

    try {
        const userSnap = await getDoc(doc(db, "users", userId));
        const currentUser = auth.currentUser;

        if (userSnap.exists()) {
            const data = userSnap.data();
            const isOwner = currentUser && currentUser.uid === userId;

            profileDiv.innerHTML = `
                <div class="profile-header" style="text-align:center; padding: 20px;">
                    <img src="${data.photoURL}" class="avatar" style="border-radius:50%; width:100px;">
                    <h2>${data.displayName} (@${data.username})</h2>
                    
                    ${isOwner ? `
                        <div class="owner-section" style="background: #161a21; padding: 10px; border-radius: 8px; margin-top: 10px;">
                            <p><b>Email:</b> ${data.email}</p>
                            <p><i>Bio: ${data.bio}</i></p>
                            <button onclick="alert('Fitur Edit Profil Segera Hadir!')">Edit Profil</button>
                        </div>
                    ` : ""}

                    <div class="creation-section" style="margin-top: 20px;">
                        <button class="btn-creation" style="background:#00ff88; color:black; border:none; padding:10px 20px; font-weight:bold; cursor:pointer; border-radius:5px;">
                            Lihat Komik Buatan ${data.displayName}
                        </button>
                    </div>
                </div>
            `;
        } else {
            profileDiv.innerHTML = "<h2>User tidak ditemukan.</h2>";
        }
    } catch (error) {
        console.error("Error Muat Profil:", error);
    }
}

// --- D. LOGIKA HALAMAN UTAMA (MENAMPILKAN SEMUA KOMIK) ---

async function loadHome() {
    const comicGrid = document.getElementById('comic-list');
    
    if (!comicGrid) return;

    try {
        const q = query(collection(db, "comics"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        comicGrid.innerHTML = "";

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const id = doc.id;

            comicGrid.innerHTML += `
                <a href="detail.html?id=${id}" class="comic-card">
                    <div class="thumbnail">
                        <img src="${data.coverUrl}" alt="${data.title}">
                    </div>
                    <div class="comic-info">
                        <h3>${data.title}</h3>
                        <p>${data.genre}</p>
                    </div>
                </a>
            `;
        });
    } catch (error) {
        console.error("Gagal memuat halaman utama:", error);
    }
}

// Jalankan Load Home
loadHome();
// Jalankan Muat Profil (jika di halaman profile.html)
muatProfil();

// --- E. LOGIKA NAVBAR & MOBILE OPTIMIZATION ---

// 1. Toggle Hamburger Menu
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// 2. Pantau Status Login untuk Update UI Navbar
onAuthStateChanged(auth, (user) => {
    const authSection = document.getElementById('auth-section');
    if (!authSection) return;

    if (user) {
        // Jika sudah login, ganti tombol Sign In jadi link Dashboard & Foto
        authSection.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <a href="dashboard.html" style="color:#00ff88; font-weight:bold; font-size:12px;">DASHBOARD</a>
                <img src="${user.photoURL}" style="width:30px; border-radius:50%; border:1px solid #00ff88; cursor:pointer;" onclick="window.location.href='profile.html?uid=${user.uid}'">
            </div>
        `;
    } else {
        // Jika belum login, tampilkan tombol Sign In
        authSection.innerHTML = `
            <button onclick="loginGoogle()" style="background:#00ff88; color:black; border:none; padding:5px 15px; border-radius:5px; font-weight:bold; cursor:pointer;">SIGN IN</button>
        `;
    }
});
