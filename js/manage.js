import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, serverTimestamp, doc, 
    getDoc, getDocs, query, orderBy, where, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

// --- AMBIL ID DARI URL (Untuk halaman manage.html) ---
const urlParams = new URLSearchParams(window.location.search);
const comicId = urlParams.get('id');

onAuthStateChanged(auth, (user) => {
    if (!user) {
        if (document.getElementById('auth-overlay')) document.getElementById('auth-overlay').style.display = 'block';
        if (document.getElementById('dashboard-ui')) document.getElementById('dashboard-ui').style.display = 'none';
    } else {
        if (document.getElementById('auth-overlay')) document.getElementById('auth-overlay').style.display = 'none';
        if (document.getElementById('dashboard-ui')) document.getElementById('dashboard-ui').style.display = 'block';
        
        const path = window.location.pathname;
        if (path.includes('dashboard.html')) muatKomikSaya();
        if (path.includes('manage.html') && comicId) {
            muatDataSeries();
            muatDaftarChapter();
        }
    }
});

// ==========================================
// 1. LOGIKA DASHBOARD (LIST KOMIK)
// ==========================================
async function muatKomikSaya() {
    const list = document.getElementById('my-comic-list');
    if (!list) return;

    try {
        const q = query(collection(db, "comics"), where("authorId", "==", auth.currentUser.uid));
        const snap = await getDocs(q);
        list.innerHTML = "";
        
        if (snap.empty) {
            list.innerHTML = "<p style='color: #8b949e;'>Kamu belum membuat komik.</p>";
            return;
        }

        snap.forEach(d => {
            const data = d.data();
            list.innerHTML += `
                <div style="background:#161a21; padding:15px; border-radius:10px; display:flex; gap:15px; align-items:center; border:1px solid #333;">
                    <img src="${data.coverUrl}" style="width:50px; height:70px; object-fit:cover; border-radius:5px;">
                    <div style="flex-grow:1;">
                        <h4 style="margin:0;">${data.title}</h4>
                        <small style="color:#00ff88;">Status: ${data.status || 'pending'}</small>
                    </div>
                    <button onclick="location.href='manage.html?id=${d.id}'" style="background:#333; color:white; border:none; padding:8px 12px; border-radius:4px; cursor:pointer;">Manage</button>
                </div>`;
        });
    } catch (e) { console.error(e); }
}

// ==========================================
// 2. LOGIKA MANAGE SERIES (EDIT & CHAPTER)
// ==========================================

// --- MUAT DATA AWAL SERIES ---
async function muatDataSeries() {
    const titleDisp = document.getElementById('display-title');
    const snap = await getDoc(doc(db, "comics", comicId));
    if (snap.exists()) {
        const data = snap.data();
        if (titleDisp) titleDisp.innerText = data.title;
        if (document.getElementById('edit-writer')) document.getElementById('edit-writer').value = data.writer || "";
        if (document.getElementById('edit-artist')) document.getElementById('edit-artist').value = data.artist || "";
        if (document.getElementById('edit-rating')) document.getElementById('edit-rating').value = data.rating || "SU";
        if (document.getElementById('edit-comment')) document.getElementById('edit-comment').value = data.commentStatus || "aktif";
    }
}

// --- UPDATE DATA SERIES ---
const btnUpdate = document.getElementById('btn-update-series');
if (btnUpdate) {
    btnUpdate.onclick = async () => {
        btnUpdate.innerText = "Saving...";
        try {
            await updateDoc(doc(db, "comics", comicId), {
                writer: document.getElementById('edit-writer').value,
                artist: document.getElementById('edit-artist').value,
                rating: document.getElementById('edit-rating').value,
                commentStatus: document.getElementById('edit-comment').value,
                updatedAt: serverTimestamp()
            });
            alert("Data Berhasil Diperbarui!");
        } catch (e) { alert("Gagal: " + e.message); }
        btnUpdate.innerText = "UPDATE DATA SERIES";
    };
}

// --- UPLOAD CHAPTER BARU ---
const btnCh = document.getElementById('btn-upload-chapter');
if (btnCh) {
    btnCh.onclick = async () => {
        const title = document.getElementById('ch-title').value;
        const files = document.getElementById('ch-files').files;
        const progress = document.getElementById('upload-progress');
        
        if (!title || files.length === 0) return alert("Isi judul chapter dan pilih gambar!");

        btnCh.disabled = true;
        progress.style.display = "block";
        const imageUrls = [];

        try {
            for (let i = 0; i < files.length; i++) {
                progress.innerText = `Mengunggah Gambar ${i + 1} dari ${files.length}...`;
                const formData = new FormData();
                formData.append('image', files[i]);
                const res = await fetch('https://api.imgbb.com/1/upload?key=daa2bcb021279c96cebd854f8650d77e', { method: 'POST', body: formData });
                const resJson = await res.json();
                imageUrls.push(resJson.data.url);
            }

            await addDoc(collection(db, "chapters"), {
                comicId: comicId,
                chapterTitle: title,
                images: imageUrls,
                createdAt: serverTimestamp()
            });

            alert("Chapter Berhasil Rilis!");
            location.reload();
        } catch (e) { alert("Error: " + e.message); btnCh.disabled = false; }
    };
}

// --- MUAT DAFTAR CHAPTER ---
async function muatDaftarChapter() {
    const list = document.getElementById('chapter-list');
    if (!list) return;
    const q = query(collection(db, "chapters"), where("comicId", "==", comicId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    list.innerHTML = "";
    snap.forEach((c) => {
        list.innerHTML += `
            <div class="chapter-list-item">
                <span>${c.data().chapterTitle}</span>
                <button style="background:#ff4444; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;" class="btn-delete-ch" data-id="${c.id}">Hapus</button>
            </div>`;
    });

    // Event listener untuk tombol hapus
    document.querySelectorAll('.btn-delete-ch').forEach(btn => {
        btn.onclick = async () => {
            if(confirm("Hapus chapter ini?")) {
                await deleteDoc(doc(db, "chapters", btn.dataset.id));
                location.reload();
            }
        };
    });
}

// ==========================================
// 3. LOGIKA CREATE SERIES & LOGOUT
// ==========================================
const btnCreate = document.getElementById('btn-create-series');
if (btnCreate) {
    btnCreate.onclick = async () => {
        const title = document.getElementById('comic-title').value;
        const file = document.getElementById('file-input').files[0];
        if (!title || !file) return alert("Mohon lengkapi judul dan cover!");
        btnCreate.disabled = true;
        btnCreate.innerText = "Processing...";
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await fetch('https://api.imgbb.com/1/upload?key=daa2bcb021279c96cebd854f8650d77e', { method: 'POST', body: formData });
            const imgData = await res.json();
            await addDoc(collection(db, "comics"), {
                title: title,
                genre: document.getElementById('comic-genre').value,
                summary: document.getElementById('comic-summary').value,
                coverUrl: imgData.data.url,
                authorId: auth.currentUser.uid,
                status: "published",
                createdAt: serverTimestamp()
            });
            alert("Karya berhasil diterbitkan!");
            location.reload();
        } catch (e) { alert(e.message); btnCreate.disabled = false; }
    };
}

const logoutBtn = document.getElementById('btn-logout');
if (logoutBtn) logoutBtn.onclick = () => signOut(auth).then(() => location.href='index.html');
