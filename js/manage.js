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
const IMGBB_KEY = 'daa2bcb021279c96cebd854f8650d77e';

// Penampung File Global (Agar bisa diurutkan dan dihapus sebelum upload)
window.selectedFilesArray = [];

// ==========================================
// 1. AUTH & ROUTING KONTROL
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (!user) {
        location.href = 'index.html'; 
        return;
    }
    if (comicId) {
        muatDataSeries();
        muatDaftarChapter();
        muatStatistik();
    } else {
        const myComicList = document.getElementById('my-comic-list');
        if (myComicList) muatKomikSaya(user.uid);
    }
});

// ==========================================
// 2. MUAT DATA SERIES (DETAIL MANAGE)
// ==========================================
async function muatDataSeries() {
    const titleDisp = document.getElementById('display-title');
    const coverPreview = document.getElementById('cover-preview');
    try {
        const snap = await getDoc(doc(db, "comics", comicId));
        if (snap.exists()) {
            const d = snap.data();
            if (titleDisp) titleDisp.innerText = d.title;
            if (coverPreview) coverPreview.src = d.coverUrl || 'img/placeholder.jpg';
            const fields = {
                'edit-title': d.title,
                'edit-summary': d.summary,
                'edit-writer': d.writer,
                'edit-artist': d.artist,
                'edit-colorist': d.colorist,
                'edit-letterer': d.letterer,
                'edit-editor': d.editor,
                'edit-translator': d.translator,
                'edit-status': d.statusSeries,
                'edit-privacy': d.privacyMode || 'public',
                'edit-password': d.password || '',
                'edit-rating-age': d.ratingAge || 'SU',
                'edit-comment': d.commentStatus || 'aktif'
            };
            for (const [id, value] of Object.entries(fields)) {
                const el = document.getElementById(id);
                if (el) el.value = value || "";
            }
            if (d.privacyMode === 'password') {
                document.getElementById('password-box').style.display = 'block';
            }
        }
    } catch (e) { console.error("Error Load Series:", e); }
}

// ==========================================
// 3. STATISTIK REAL-TIME
// ==========================================
async function muatStatistik() {
    try {
        const snap = await getDoc(doc(db, "comics", comicId));
        const data = snap.data();
        document.getElementById('stat-views').innerText = data.views || 0;
        document.getElementById('stat-likes').innerText = data.likes || 0;
        document.getElementById('stat-subs').innerText = data.subscribers || 0;
        const qComm = query(collection(db, "chapters"), where("comicId", "==", comicId));
        const commSnap = await getDocs(qComm);
        document.getElementById('stat-comments').innerText = commSnap.size;
    } catch (e) { console.log("Statistik belum tersedia"); }
}

// ==========================================
// 4. UPDATE DATA SERIES (SIMPAN PERUBAHAN)
// ==========================================
const btnUpdate = document.getElementById('btn-update-series');
if (btnUpdate) {
    btnUpdate.onclick = async () => {
        btnUpdate.disabled = true;
        const originalText = btnUpdate.innerHTML;
        btnUpdate.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> Menyimpan...";
        try {
            const docRef = doc(db, "comics", comicId);
            let finalCoverUrl = document.getElementById('cover-preview').src;
            const coverFile = document.getElementById('edit-cover-file').files[0];
            if (coverFile) {
                const formData = new FormData();
                formData.append('image', coverFile);
                const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: formData });
                const imgData = await res.json();
                finalCoverUrl = imgData.data.url;
            }
            await updateDoc(docRef, {
                title: document.getElementById('edit-title').value,
                summary: document.getElementById('edit-summary').value,
                writer: document.getElementById('edit-writer').value,
                artist: document.getElementById('edit-artist').value,
                colorist: document.getElementById('edit-colorist').value,
                letterer: document.getElementById('edit-letterer').value,
                editor: document.getElementById('edit-editor').value,
                translator: document.getElementById('edit-translator').value,
                statusSeries: document.getElementById('edit-status').value,
                privacyMode: document.getElementById('edit-privacy').value,
                password: document.getElementById('edit-password').value,
                ratingAge: document.getElementById('edit-rating-age').value,
                commentStatus: document.getElementById('edit-comment').value,
                coverUrl: finalCoverUrl,
                updatedAt: serverTimestamp()
            });
            alert("✅ Sukses! Data series telah diperbarui.");
            location.reload();
        } catch (e) {
            alert("❌ Gagal update: " + e.message);
        } finally {
            btnUpdate.disabled = false;
            btnUpdate.innerHTML = originalText;
        }
    };
}

// ==========================================
// 5. FITUR PREVIEW, HAPUS, & URUTAN FILE (UI)
// ==========================================
const chFileInput = document.getElementById('ch-files');
if (chFileInput) {
    chFileInput.onchange = (e) => {
        const newFiles = Array.from(e.target.files);
        window.selectedFilesArray = [...window.selectedFilesArray, ...newFiles];
        renderFilePreview();
        chFileInput.value = ""; // Reset input agar bisa pilih file yang sama jika perlu
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
// 6. UPLOAD CHAPTER KE FIREBASE
// ==========================================
const btnUploadCh = document.getElementById('btn-upload-chapter');
if (btnUploadCh) {
    btnUploadCh.onclick = async () => {
        const title = document.getElementById('ch-title').value;
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

            if (barFill) barFill.style.width = "100%";
            alert("🚀 Chapter Berhasil Dipublikasikan!");
            window.selectedFilesArray = [];
            location.reload();
        } catch (e) {
            alert("Gagal upload chapter: " + e.message);
            btnUploadCh.disabled = false;
        }
    };
}

// ==========================================
// 7. MANAJEMEN DAFTAR CHAPTER
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
            location.reload();
        } catch (e) { alert("Gagal."); }
    }
};

// ==========================================
// 8. TOOLS LAINNYA
// ==========================================
window.previewSeries = () => { window.open(`detail.html?id=${comicId}`, '_blank'); };

window.deleteSeries = async () => {
    if (confirm("‼️ Hapus seluruh series?")) {
        const password = prompt("Ketik 'KONFIRMASI':");
        if (password === 'KONFIRMASI') {
            await deleteDoc(doc(db, "comics", comicId));
            location.href = 'dashboard.html';
        }
    }
};

const coverInput = document.getElementById('edit-cover-file');
if (coverInput) {
    coverInput.onchange = (e) => {
        const [file] = e.target.files;
        if (file) document.getElementById('cover-preview').src = URL.createObjectURL(file);
    };
}
