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

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html'; // Proteksi jika belum login
    } else {
        const path = window.location.pathname;
        if (path.includes('dashboard.html')) muatKomikSaya();
        if (path.includes('manage.html') && comicId) {
            muatDataSeries();
            muatDaftarChapter();
        }
    }
});

// ==========================================
// 1. DASHBOARD LOGIC
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
                <div class="comic-card-simple" style="background:#161a21; padding:15px; border-radius:10px; display:flex; gap:15px; align-items:center; border:1px solid #333; margin-bottom:10px;">
                    <img src="${data.coverUrl}" style="width:50px; height:70px; object-fit:cover; border-radius:5px;">
                    <div style="flex-grow:1;">
                        <h4 style="margin:0;">${data.title}</h4>
                        <small style="color:#00ff88;">Status: ${data.statusSeries || 'ONGOING'}</small>
                    </div>
                    <button onclick="location.href='manage.html?id=${d.id}'" class="btn btn-outline" style="padding: 5px 15px;">Manage</button>
                </div>`;
        });
    } catch (e) { console.error(e); }
}

// ==========================================
// 2. MANAGE SERIES LOGIC (UPDATE & CHAPTERS)
// ==========================================

async function muatDataSeries() {
    const titleDisp = document.getElementById('display-title');
    const snap = await getDoc(doc(db, "comics", comicId));
    
    if (snap.exists()) {
        const d = snap.data();
        if (titleDisp) titleDisp.innerText = d.title;

        // Map data ke input (Gunakan ID yang sesuai dengan HTML)
        const fields = {
            'edit-writer': d.writer,
            'edit-artist': d.artist,
            'edit-colorist': d.colorist,
            'edit-letterer': d.letterer,
            'edit-inker': d.inker,
            'edit-editor': d.editor,
            'edit-layout': d.layoutArtist,
            'edit-translator': d.translator,
            'edit-social': d.socialLink,
            'edit-dedication': d.dedication,
            'edit-summary': d.summary,
            'edit-genre': d.genre,
            'edit-status': d.statusSeries,
            'edit-rating': d.rating,
            'edit-comment': d.commentStatus,
            'edit-tags': d.tags
        };

        for (const [id, value] of Object.entries(fields)) {
            const el = document.getElementById(id);
            if (el) el.value = value || "";
        }
    }
}

const btnUpdate = document.getElementById('btn-update-series');
if (btnUpdate) {
    btnUpdate.onclick = async () => {
        const originalText = btnUpdate.innerHTML;
        btnUpdate.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> SAVING...";
        btnUpdate.disabled = true;

        try {
            await updateDoc(doc(db, "comics", comicId), {
                writer: document.getElementById('edit-writer').value,
                artist: document.getElementById('edit-artist').value,
                colorist: document.getElementById('edit-colorist').value,
                letterer: document.getElementById('edit-letterer').value,
                inker: document.getElementById('edit-inker').value,
                editor: document.getElementById('edit-editor').value,
                layoutArtist: document.getElementById('edit-layout').value,
                translator: document.getElementById('edit-translator').value,
                socialLink: document.getElementById('edit-social').value,
                dedication: document.getElementById('edit-dedication').value,
                summary: document.getElementById('edit-summary').value,
                genre: document.getElementById('edit-genre').value,
                statusSeries: document.getElementById('edit-status').value,
                rating: document.getElementById('edit-rating').value,
                commentStatus: document.getElementById('edit-comment').value,
                tags: document.getElementById('edit-tags').value,
                updatedAt: serverTimestamp()
            });
            alert("✅ Berhasil memperbarui data series!");
        } catch (e) {
            alert("❌ Gagal: " + e.message);
        } finally {
            btnUpdate.innerHTML = originalText;
            btnUpdate.disabled = false;
        }
    };
}

// --- UPLOAD CHAPTER BARU (BATCH UPLOAD) ---
const btnCh = document.getElementById('btn-upload-chapter');
if (btnCh) {
    btnCh.onclick = async () => {
        const title = document.getElementById('ch-title').value;
        const files = document.getElementById('ch-files').files;
        const progressArea = document.getElementById('upload-progress');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');

        if (!title || files.length === 0) return alert("Harap isi judul chapter dan pilih gambar!");

        btnCh.disabled = true;
        progressArea.style.display = "block";
        const imageUrls = [];

        try {
            for (let i = 0; i < files.length; i++) {
                // Update Progress UI
                const percent = Math.round(((i + 1) / files.length) * 100);
                progressBar.style.width = percent + "%";
                progressText.innerText = `Mengunggah ${i+1}/${files.length} (${percent}%)`;

                const formData = new FormData();
                formData.append('image', files[i]);
                
                const res = await fetch('https://api.imgbb.com/1/upload?key=daa2bcb021279c96cebd854f8650d77e', { method: 'POST', body: formData });
                const resJson = await res.json();
                
                if (resJson.success) {
                    imageUrls.push(resJson.data.url);
                }
            }

            await addDoc(collection(db, "chapters"), {
                comicId: comicId,
                chapterTitle: title,
                images: imageUrls,
                authorId: auth.currentUser.uid,
                createdAt: serverTimestamp()
            });

            alert("🚀 Chapter Berhasil Dirilis!");
            location.reload();
        } catch (e) {
            alert("❌ Upload Gagal: " + e.message);
            btnCh.disabled = false;
        }
    };
}

async function muatDaftarChapter() {
    const list = document.getElementById('chapter-list');
    if (!list) return;

    const q = query(collection(db, "chapters"), where("comicId", "==", comicId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    list.innerHTML = "";

    snap.forEach((c) => {
        const item = document.createElement('div');
        item.className = "chapter-item";
        item.innerHTML = `
            <span><i class="fa-solid fa-file-image"></i> ${c.data().chapterTitle}</span>
            <button class="btn-del" data-id="${c.id}"><i class="fa-solid fa-trash"></i></button>
        `;
        list.appendChild(item);

        // Listener Hapus
        item.querySelector('.btn-del').onclick = async () => {
            if (confirm("Hapus chapter ini secara permanen?")) {
                await deleteDoc(doc(db, "chapters", c.id));
                location.reload();
            }
        };
    });
}

// --- CREATE NEW SERIES (DASHBOARD) ---
const btnCreate = document.getElementById('btn-create-series');
if (btnCreate) {
    btnCreate.onclick = async () => {
        const title = document.getElementById('comic-title').value;
        const file = document.getElementById('file-input').files[0];
        if (!title || !file) return alert("Judul dan Cover wajib ada!");

        btnCreate.disabled = true;
        btnCreate.innerText = "Publishing...";

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
                writer: "", artist: "", colorist: "", letterer: "", // Inisialisasi kosong
                createdAt: serverTimestamp()
            });

            alert("Karya berhasil dibuat!");
            location.reload();
        } catch (e) { alert(e.message); btnCreate.disabled = false; }
    };
}

// --- LOGOUT ---
const logoutBtn = document.getElementById('btn-logout');
if (logoutBtn) logoutBtn.onclick = () => signOut(auth).then(() => location.href='index.html');
