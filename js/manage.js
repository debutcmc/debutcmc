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

const urlParams = new URLSearchParams(window.location.search);
const comicId = urlParams.get('id');

// ==========================================
// 1. PUSAT KENDALI (LOGIN & ROUTING)
// ==========================================
onAuthStateChanged(auth, (user) => {
    const dashboardUI = document.getElementById('dashboard-ui');
    const authOverlay = document.getElementById('auth-overlay');

    if (!user) {
        if (authOverlay) authOverlay.style.display = 'block';
        if (dashboardUI) dashboardUI.style.display = 'none';
        return;
    }

    // Munculkan Dashboard jika user login
    if (dashboardUI) dashboardUI.style.display = 'block';
    if (authOverlay) authOverlay.style.display = 'none';

    // CEK HALAMAN: Apakah sedang mengelola komik spesifik atau list utama?
    if (comicId) {
        // Jika ada ID di URL, jalankan fitur Edit & Chapter
        muatDataSeries();
        muatDaftarChapter();
    } else {
        // Jika tidak ada ID, tampilkan daftar komik milik user
        muatKomikSaya(user.uid);
    }
});

// ==========================================
// 2. FITUR LIST KOMIK (DASHBOARD)
// ==========================================
async function muatKomikSaya(uid) {
    const list = document.getElementById('my-comic-list');
    if (!list) return;

    list.innerHTML = "<p>Memuat karya kamu...</p>";
    try {
        const q = query(collection(db, "comics"), where("authorId", "==", uid));
        const snap = await getDocs(q);
        list.innerHTML = "";
        
        if (snap.empty) {
            list.innerHTML = "<p>Kamu belum punya karya. Buat di tab 'BUAT SERIES'.</p>";
            return;
        }

        snap.forEach(d => {
            const data = d.data();
            list.innerHTML += `
                <div class="comic-card-simple" style="background:#161a21; padding:15px; border-radius:10px; display:flex; gap:15px; align-items:center; border:1px solid #333; margin-bottom:12px;">
                    <img src="${data.coverUrl}" style="width:55px; height:80px; object-fit:cover; border-radius:6px;">
                    <div style="flex-grow:1;">
                        <h4 style="margin:0;">${data.title}</h4>
                        <small style="color:#00ff88;">${data.statusSeries || 'ONGOING'}</small>
                    </div>
                    <button onclick="location.href='manage.html?id=${d.id}'" style="background:#3d5afe; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold;">MANAGE</button>
                </div>`;
        });
    } catch (e) { console.error("Error Load List:", e); }
}

// ==========================================
// 3. FITUR BUAT SERIES BARU
// ==========================================
const btnCreate = document.getElementById('btn-create-series');
if (btnCreate) {
    btnCreate.onclick = async () => {
        const title = document.getElementById('comic-title').value;
        const file = document.getElementById('file-input').files[0];
        if (!title || !file) return alert("Judul dan Cover wajib ada!");

        btnCreate.disabled = true;
        btnCreate.innerHTML = "Publishing...";

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
                statusSeries: "ONGOING",
                createdAt: serverTimestamp()
            });

            alert("Karya berhasil dibuat!");
            location.reload();
        } catch (e) { alert("Gagal: " + e.message); btnCreate.disabled = false; }
    };
}

// ==========================================
// 4. FITUR MANAGE / EDIT DATA SERIES
// ==========================================
async function muatDataSeries() {
    const titleDisp = document.getElementById('display-title');
    try {
        const snap = await getDoc(doc(db, "comics", comicId));
        if (snap.exists()) {
            const d = snap.data();
            if (titleDisp) titleDisp.innerText = d.title;

            // List ID input yang ingin diisi otomatis saat edit
            const fields = {
                'edit-writer': d.writer, 'edit-artist': d.artist, 'edit-summary': d.summary,
                'edit-genre': d.genre, 'edit-status': d.statusSeries
            };
            for (const [id, value] of Object.entries(fields)) {
                const el = document.getElementById(id);
                if (el) el.value = value || "";
            }
        }
    } catch (e) { console.error("Load Data Error:", e); }
}

// ==========================================
// 5. FITUR UPLOAD CHAPTER
// ==========================================
const btnCh = document.getElementById('btn-upload-chapter');
if (btnCh) {
    btnCh.onclick = async () => {
        const title = document.getElementById('ch-title').value;
        const files = document.getElementById('ch-files').files;
        if (!title || files.length === 0) return alert("Isi judul dan pilih gambar!");

        btnCh.disabled = true;
        btnCh.innerText = "Uploading...";
        const imageUrls = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const formData = new FormData();
                formData.append('image', files[i]);
                const res = await fetch('https://api.imgbb.com/1/upload?key=daa2bcb021279c96cebd854f8650d77e', { method: 'POST', body: formData });
                const resJson = await res.json();
                if (resJson.success) imageUrls.push(resJson.data.url);
            }

            await addDoc(collection(db, "chapters"), {
                comicId: comicId,
                chapterTitle: title,
                images: imageUrls,
                authorId: auth.currentUser.uid,
                createdAt: serverTimestamp()
            });

            alert("Chapter Berhasil Dirilis!");
            location.reload();
        } catch (e) { alert("Upload Gagal"); btnCh.disabled = false; }
    };
}

// ==========================================
// 6. FITUR DAFTAR CHAPTER & HAPUS
// ==========================================
async function muatDaftarChapter() {
    const list = document.getElementById('chapter-list');
    if (!list) return;
    try {
        const q = query(collection(db, "chapters"), where("comicId", "==", comicId), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        list.innerHTML = "";
        snap.forEach((c) => {
            const item = document.createElement('div');
            item.style = "display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #333";
            item.innerHTML = `
                <span>${c.data().chapterTitle}</span>
                <button onclick="hapusChapter('${c.id}')" style="color:#ff4444; background:none; border:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
            `;
            list.appendChild(item);
        });
    } catch (e) { console.error(e); }
}

// Global function untuk hapus chapter
window.hapusChapter = async (id) => {
    if (confirm("Hapus chapter ini?")) {
        await deleteDoc(doc(db, "chapters", id));
        location.reload();
    }
};

// LOGOUT
const logoutBtn = document.getElementById('btn-logout');
if (logoutBtn) logoutBtn.onclick = () => signOut(auth).then(() => location.href='index.html');

// ==========================================
// 7. FITUR UPDATE DATA SERIES LENGKAP
// ==========================================
const btnUpdate = document.getElementById('btn-update-series');
if (btnUpdate) {
    btnUpdate.onclick = async () => {
        const originalText = btnUpdate.innerHTML;
        btnUpdate.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> Menyimpan...";
        btnUpdate.disabled = true;

        try {
            const docRef = doc(db, "comics", comicId);
            await updateDoc(docRef, {
                writer: document.getElementById('edit-writer')?.value || "",
                artist: document.getElementById('edit-artist')?.value || "",
                colorist: document.getElementById('edit-colorist')?.value || "",
                letterer: document.getElementById('edit-letterer')?.value || "",
                inker: document.getElementById('edit-inker')?.value || "",
                editor: document.getElementById('edit-editor')?.value || "",
                layoutArtist: document.getElementById('edit-layout')?.value || "",
                translator: document.getElementById('edit-translator')?.value || "",
                socialLink: document.getElementById('edit-social')?.value || "",
                dedication: document.getElementById('edit-dedication')?.value || "",
                summary: document.getElementById('edit-summary')?.value || "",
                genre: document.getElementById('edit-genre')?.value || "ACTION",
                statusSeries: document.getElementById('edit-status')?.value || "ONGOING",
                rating: document.getElementById('edit-rating')?.value || "SU",
                commentStatus: document.getElementById('edit-comment')?.value || "aktif",
                tags: document.getElementById('edit-tags')?.value || "",
                updatedAt: serverTimestamp()
            });

            alert("✅ Data Series Berhasil Diperbarui!");
        } catch (e) {
            console.error(e);
            alert("❌ Gagal Memperbarui: " + e.message);
        } finally {
            btnUpdate.innerHTML = originalText;
            btnUpdate.disabled = false;
        }
    };
}

// Tambahan untuk memuat data baru ke form saat halaman dibuka
// (Update fungsi muatDataSeries yang ada agar mendukung input baru)
const originalMuatData = muatDataSeries;
muatDataSeries = async () => {
    await originalMuatData(); // Jalankan fungsi asli dulu
    try {
        const snap = await getDoc(doc(db, "comics", comicId));
        if (snap.exists()) {
            const d = snap.data();
            // Isi input tambahan yang belum ada di fungsi lama
            const extraFields = {
                'edit-colorist': d.colorist, 'edit-letterer': d.letterer,
                'edit-inker': d.inker, 'edit-editor': d.editor,
                'edit-layout': d.layoutArtist, 'edit-translator': d.translator,
                'edit-social': d.socialLink, 'edit-dedication': d.dedication,
                'edit-rating': d.rating, 'edit-comment': d.commentStatus,
                'edit-tags': d.tags
            };
            for (const [id, value] of Object.entries(extraFields)) {
                const el = document.getElementById(id);
                if (el) el.value = value || "";
            }
        }
    } catch (e) { console.error(e); }
};
