import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, serverTimestamp, doc, 
    getDoc, getDocs, query, orderBy, where, updateDoc, deleteDoc, setDoc 
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
const IMGBB_KEY = 'daa2bcb021279c96cebd854f8650d77e';

window.selectedFilesArray = [];

// ==========================================
// FITUR AUTO-SAVE & DRAFT (PENAMBAHAN BARU)
// ==========================================
function simpanDraftKeLocal() {
    if (!comicId) return;
    const draftData = {
        title: document.getElementById('comic-title')?.value || "",
        genre: document.getElementById('comic-genre')?.value || "",
        summary: document.getElementById('comic-summary')?.value || ""
    };
    localStorage.setItem(`draft_series_${comicId}`, JSON.stringify(draftData));
}

function muatDraftDariLocal() {
    const dataMentah = localStorage.getItem(`draft_series_${comicId}`);
    if (dataMentah) {
        const data = JSON.parse(dataMentah);
        // Menggunakan setTimeout dikit agar memastikan element sudah siap di DOM
        setTimeout(() => {
            if (document.getElementById('comic-title')) document.getElementById('comic-title').value = data.title;
            if (document.getElementById('comic-genre')) document.getElementById('comic-genre').value = data.genre;
            if (document.getElementById('comic-summary')) document.getElementById('comic-summary').value = data.summary;
        }, 500);
    }
}

// Pasang Listener Otomatis
document.addEventListener('input', (e) => {
    if (['comic-title', 'comic-genre', 'comic-summary'].includes(e.target.id)) {
        simpanDraftKeLocal();
    }
});

// ==========================================
// 1. AUTH & ROUTING KONTROL
// ==========================================
onAuthStateChanged(auth, (user) => {
    const authOverlay = document.getElementById('auth-overlay');
    const dashboardUI = document.getElementById('dashboard-ui');

    if (!user) {
        if (authOverlay) authOverlay.style.display = 'block';
        if (dashboardUI) dashboardUI.style.display = 'none';
        return;
    }

    if (authOverlay) authOverlay.style.display = 'none';
    if (dashboardUI) dashboardUI.style.display = 'block';

    if (comicId) {
        // muatDataSeries(); // Asumsi fungsi ini ada di HTML/global
        muatDaftarChapter();
        muatDraftDariLocal(); // Panggil Auto-fill saat login berhasil
    } else {
        muatKomikSaya(user.uid);
    }

    muatDataProfil(user);
    muatStatistikGlobal(user.uid);
});

// ==========================================
// 2. FITUR PROFIL
// ==========================================
async function muatDataProfil(user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const dispEmail = document.getElementById('user-display-email');
    const dispName = document.getElementById('user-display-name');
    const inputName = document.getElementById('profile-name');
    const inputBio = document.getElementById('profile-bio');
    const inputLink = document.getElementById('profile-link');
    const avatarPrev = document.getElementById('avatar-preview');

    if (dispEmail) dispEmail.innerText = user.email;

    if (userDoc.exists()) {
        const d = userDoc.data();
        if (dispName) dispName.innerText = d.displayName || "Kreator Baru";
        if (inputName) inputName.value = d.displayName || "";
        if (inputBio) inputBio.value = d.bio || "";
        if (inputLink) inputLink.value = d.socialLink || "";
        if (avatarPrev && d.photoURL) avatarPrev.src = d.photoURL;
    }
}

document.getElementById('btn-update-profile')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-update-profile');
    btn.disabled = true;
    const user = auth.currentUser;

    try {
        let photoURL = document.getElementById('avatar-preview').src;
        const fileInput = document.getElementById('avatar-input');
        
        if (fileInput.files[0]) {
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: formData });
            const resJson = await res.json();
            photoURL = resJson.data.url;
        }

        await setDoc(doc(db, "users", user.uid), {
            displayName: document.getElementById('profile-name').value,
            bio: document.getElementById('profile-bio').value,
            socialLink: document.getElementById('profile-link').value,
            photoURL: photoURL,
            updatedAt: serverTimestamp()
        }, { merge: true });

        alert("Profil diperbarui!");
        location.reload();
    } catch (e) {
        alert("Gagal update profil: " + e.message);
    } finally { btn.disabled = false; }
});

// ==========================================
// 3. STATISTIK GLOBAL
// ==========================================
async function muatStatistikGlobal(uid) {
    try {
        const q = query(collection(db, "comics"), where("authorId", "==", uid));
        const snap = await getDocs(q);
        let totalViews = 0;
        let totalLikes = 0;

        snap.forEach(doc => {
            const d = doc.data();
            totalViews += (d.views || 0);
            totalLikes += (d.likes || 0);
        });

        if(document.getElementById('total-views')) document.getElementById('total-views').innerText = totalViews;
        if(document.getElementById('total-likes')) document.getElementById('total-likes').innerText = totalLikes;
    } catch (e) { console.error("Stats Error:", e); }
}

// ==========================================
// 4. DAFTAR KOMIK DI DASHBOARD
// ==========================================
async function muatKomikSaya(uid) {
    const list = document.getElementById('my-comic-list');
    if (!list) return;

    try {
        const q = query(collection(db, "comics"), where("authorId", "==", uid));
        const snap = await getDocs(q);
        list.innerHTML = "";

        if (snap.empty) {
            list.innerHTML = "<p>Belum ada karya.</p>";
            return;
        }

        snap.forEach((doc) => {
            const d = doc.data();
            const div = document.createElement('div');
            div.className = "card"; 
            div.style = "padding: 15px; display: flex; flex-direction: column; gap: 10px;";
            div.innerHTML = `
                <img src="${d.coverUrl || 'https://via.placeholder.com/150'}" style="width:100%; height:200px; object-fit:cover; border-radius:8px;">
                <h4 style="margin:0;">${d.title}</h4>
                <div style="font-size:12px; color:gray;">👁️ ${d.views || 0} | ❤️ ${d.likes || 0}</div>
                <button onclick="location.href='manage.html?id=${doc.id}'" class="btn-main" style="padding:8px; font-size:12px;">KELOLA</button>
            `;
            list.appendChild(div);
        });
    } catch (e) { console.error(e); }
}

// ==========================================
// 5. BUAT SERIES BARU
// ==========================================
document.getElementById('btn-create-series')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-create-series');
    const title = document.getElementById('comic-title').value;
    const genre = document.getElementById('comic-genre').value;
    const summary = document.getElementById('comic-summary').value;
    const file = document.getElementById('file-input').files[0];

    if (!title || !file) return alert("Judul dan Cover wajib diisi!");

    btn.disabled = true;
    btn.innerText = "Menerbitkan...";

    try {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: formData });
        const resJson = await res.json();
        const coverUrl = resJson.data.url;

        await addDoc(collection(db, "comics"), {
            title, genre, summary, coverUrl,
            authorId: auth.currentUser.uid,
            views: 0, likes: 0, subscribers: 0,
            statusSeries: "ONGOING",
            createdAt: serverTimestamp()
        });

        alert("Series Berhasil Dibuat!");
        location.reload();
    } catch (e) {
        alert("Gagal: " + e.message);
    } finally { btn.disabled = false; }
});

// ==========================================
// 6. LOGOUT
// ==========================================
document.getElementById('btn-logout')?.addEventListener('click', async () => {
    if (confirm("Logout?")) {
        await signOut(auth);
        location.href = 'index.html';
    }
});

// ==========================================
// 7. PREVIEW & URUTAN FILE CHAPTER
// ==========================================
const chFileInput = document.getElementById('ch-files');
if (chFileInput) {
    chFileInput.onchange = (e) => {
        const newFiles = Array.from(e.target.files);
        window.selectedFilesArray = [...window.selectedFilesArray, ...newFiles];
        renderFilePreview();
        chFileInput.value = ""; 
    };
}

function renderFilePreview() {
    const container = document.getElementById('file-preview-container');
    const status = document.getElementById('upload-status');
    if (!container) return;
    container.innerHTML = "";

    window.selectedFilesArray.forEach((file, index) => {
        const item = document.createElement('div');
        item.style = "background:#1c2128; padding:8px; border-radius:6px; display:flex; align-items:center; gap:10px; border:1px solid #30363d; margin-bottom:5px;";
        item.innerHTML = `
            <span style="color:#8b949e; font-family:monospace; min-width:20px;">${index + 1}</span>
            <img src="${URL.createObjectURL(file)}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
            <span style="flex-grow:1; font-size:12px; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${file.name}</span>
            <div style="display:flex; gap:5px;">
                <button type="button" onclick="window.moveFile(${index}, -1)" style="background:#30363d; border:none; color:white; padding:4px 8px; cursor:pointer; border-radius:4px;"><i class="fa-solid fa-arrow-up"></i></button>
                <button type="button" onclick="window.moveFile(${index}, 1)" style="background:#30363d; border:none; color:white; padding:4px 8px; cursor:pointer; border-radius:4px;"><i class="fa-solid fa-arrow-down"></i></button>
                <button type="button" onclick="window.removeFile(${index})" style="background:#ff444422; border:none; color:#ff4444; padding:4px 8px; cursor:pointer; border-radius:4px;"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
        container.appendChild(item);
    });
    if (status) status.innerText = window.selectedFilesArray.length > 0 ? `✅ ${window.selectedFilesArray.length} Gambar terpilih` : "";
}

window.removeFile = (index) => {
    window.selectedFilesArray.splice(index, 1);
    renderFilePreview();
};

window.moveFile = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < window.selectedFilesArray.length) {
        const temp = window.selectedFilesArray[index];
        window.selectedFilesArray[index] = window.selectedFilesArray[newIndex];
        window.selectedFilesArray[newIndex] = temp;
        renderFilePreview();
    }
};

// ==========================================
// 8. UPLOAD CHAPTER BARU (DIPERBAIKI AGAR TIDAK HILANG)
// ==========================================
const btnUploadCh = document.getElementById('btn-upload-chapter');
if (btnUploadCh) {
    btnUploadCh.onclick = async () => {
        const titleInput = document.getElementById('ch-title');
        const title = titleInput.value;
        const files = window.selectedFilesArray;
        const progressBox = document.getElementById('upload-progress-box');
        const barFill = document.getElementById('bar-fill');
        const barText = document.getElementById('bar-text');

        if (!title || files.length === 0) return alert("Lengkapi judul dan pilih gambar!");

        btnUploadCh.disabled = true;
        if (progressBox) progressBox.style.display = 'block';
        const imageUrls = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const percent = Math.round(((i) / files.length) * 100);
                if (barFill) barFill.style.width = percent + "%";
                if (barText) barText.innerText = `Mengunggah halaman ${i + 1} dari ${files.length}...`;

                const formData = new FormData();
                formData.append('image', files[i]);
                const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: formData });
                const resJson = await res.json();
                if (resJson.success) imageUrls.push(resJson.data.url);
            }

            await addDoc(collection(db, "chapters"), {
                comicId: comicId,
                chapterTitle: title,
                images: imageUrls,
                authorId: auth.currentUser.uid,
                createdAt: serverTimestamp(),
                views: 0,
                likes: 0
            });

            alert("🚀 Chapter Berhasil Dipublikasikan!");
            
            // PERBAIKAN: Jangan reload, cukup bersihkan field chapter
            window.selectedFilesArray = [];
            renderFilePreview();
            titleInput.value = "";
            if (progressBox) progressBox.style.display = 'none';
            
            // Muat ulang daftar chapter agar muncul yang baru
            muatDaftarChapter();
            btnUploadCh.disabled = false;

        } catch (e) {
            alert("Gagal upload chapter: " + e.message);
            btnUploadCh.disabled = false;
        }
    };
}

// ==========================================
// 9. MUAT & HAPUS CHAPTER
// ==========================================
async function muatDaftarChapter() {
    const list = document.getElementById('chapter-list');
    if (!list) return;
    try {
        const q = query(collection(db, "chapters"), where("comicId", "==", comicId), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        list.innerHTML = "";
        if (snap.empty) {
            list.innerHTML = "<p style='color:gray; font-size:12px; text-align:center;'>Belum ada chapter.</p>";
            return;
        }
        snap.forEach((c) => {
            const d = c.data();
            const item = document.createElement('div');
            item.className = "chapter-item";
            item.innerHTML = `
                <div class="chapter-info" style="display:flex; align-items:center; gap:10px; padding:10px; border-bottom:1px solid #333;">
                    <i class="fa-solid fa-grip-vertical" style="color:#555;"></i>
                    <div style="flex-grow:1;">
                        <strong style="display:block; color:white;">${d.chapterTitle}</strong>
                        <small style="color:gray;">${d.images ? d.images.length : 0} Halaman</small>
                    </div>
                    <button onclick="hapusChapter('${c.id}')" style="background:none; border:none; color:#ff4444; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            list.appendChild(item);
        });
    } catch (e) { console.error(e); }
}

window.hapusChapter = async (id) => {
    if (confirm("⚠️ Hapus chapter ini?")) {
        try {
            await deleteDoc(doc(db, "chapters", id));
            muatDaftarChapter(); // Muat ulang daftar saja
        } catch (e) { alert("Gagal menghapus."); }
    }
};

// ==========================================
// 10. TOOLS & DELETE SERIES
// ==========================================
window.deleteSeries = async () => {
    if (confirm("‼️ PERINGATAN: Hapus seluruh series dan semua chapter di dalamnya?")) {
        const konfirmasi = prompt("Ketik 'HAPUS PERMANEN' untuk melanjutkan:");
        if (konfirmasi === 'HAPUS PERMANEN') {
            try {
                // Hapus draft lokal juga kalau series dihapus
                localStorage.removeItem(`draft_series_${comicId}`);
                await deleteDoc(doc(db, "comics", comicId));
                alert("Series berhasil dihapus.");
                location.href = 'dashboard.html';
            } catch (e) { alert("Gagal menghapus series."); }
        }
    }
};
