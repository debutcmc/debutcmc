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

// --- LOGIN OBSERVER (Pusat Kendali Halaman) ---
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Jika tidak login, pastikan tidak di halaman terproteksi
        if (window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('manage.html')) {
            window.location.href = 'index.html';
        }
    } else {
        const path = window.location.pathname;
        
        // LOGIKA BARU: Jika path kosong, atau root, atau dashboard.html
        const isDashboard = path.includes('dashboard.html') || path.endsWith('/') || path === "";
        const isManage = path.includes('manage.html');

        if (isDashboard) {
            console.log("📍 Menjalankan muatKomikSaya...");
            muatKomikSaya(user.uid); // Oper UID langsung agar aman
        }
        
        if (isManage && comicId) {
            console.log("📍 Menjalankan muatDataSeries...");
            muatDataSeries();
            muatDaftarChapter();
        }
    }
});

// ==========================================
// 1. DASHBOARD LOGIC (TAMPILKAN LIST KOMIK)
// ==========================================
async function muatKomikSaya(uid) {
    const list = document.getElementById('my-comic-list');
    if (!list) return;

    list.innerHTML = "<p style='color: #8b949e; text-align: center; padding: 20px;'>Memuat karya kamu...</p>";

    try {
        // Query berdasarkan UID yang dilempar dari onAuthStateChanged
        const q = query(collection(db, "comics"), where("authorId", "==", uid));
        const snap = await getDocs(q);
        
        list.innerHTML = "";
        
        if (snap.empty) {
            list.innerHTML = `
                <div style="text-align:center; padding:30px; border: 2px dashed #333; border-radius:12px;">
                    <p style='color: #8b949e;'>Kamu belum menerbitkan karya apapun.</p>
                </div>`;
            return;
        }

        snap.forEach(d => {
            const data = d.data();
            list.innerHTML += `
                <div class="comic-card-simple" style="background:#161a21; padding:15px; border-radius:10px; display:flex; gap:15px; align-items:center; border:1px solid #333; margin-bottom:12px; transition: 0.3s;">
                    <img src="${data.coverUrl}" style="width:55px; height:80px; object-fit:cover; border-radius:6px; background: #0d1117;">
                    <div style="flex-grow:1;">
                        <h4 style="margin:0; font-size: 16px;">${data.title}</h4>
                        <span style="font-size: 11px; color: var(--primary, #00ff88); background: rgba(0,255,136,0.1); padding: 2px 8px; border-radius: 4px; display: inline-block; margin-top: 5px;">
                            ${data.statusSeries || 'ONGOING'}
                        </span>
                    </div>
                    <button onclick="location.href='manage.html?id=${d.id}'" 
                            style="background: #3d5afe; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        MANAGE
                    </button>
                </div>`;
        });
    } catch (e) { 
        console.error("Dashboard Error:", e);
        list.innerHTML = "<p style='color: #ff4444;'>Gagal memuat list komik. Periksa koneksi atau database.</p>";
    }
}

// ==========================================
// 2. MANAGE SERIES LOGIC
// ==========================================

async function muatDataSeries() {
    const titleDisp = document.getElementById('display-title');
    try {
        const snap = await getDoc(doc(db, "comics", comicId));
        if (snap.exists()) {
            const d = snap.data();
            if (titleDisp) titleDisp.innerText = d.title;

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
    } catch (e) { console.error("Load Data Error:", e); }
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
        } catch (e) { alert("❌ Gagal: " + e.message); }
        finally { btnUpdate.innerHTML = originalText; btnUpdate.disabled = false; }
    };
}

// --- CHAPTER LOGIC ---
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
                const percent = Math.round(((i + 1) / files.length) * 100);
                progressBar.style.width = percent + "%";
                progressText.innerText = `Mengunggah ${i+1}/${files.length} (${percent}%)`;

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

            alert("🚀 Chapter Berhasil Dirilis!");
            location.reload();
        } catch (e) { alert("❌ Upload Gagal: " + e.message); btnCh.disabled = false; }
    };
}

async function muatDaftarChapter() {
    const list = document.getElementById('chapter-list');
    if (!list) return;
    try {
        const q = query(collection(db, "chapters"), where("comicId", "==", comicId), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        list.innerHTML = "";
        snap.forEach((c) => {
            const item = document.createElement('div');
            item.className = "chapter-item";
            item.innerHTML = `
                <span><i class="fa-solid fa-file-image"></i> ${c.data().chapterTitle}</span>
                <button class="btn-del" data-id="${c.id}" style="background:none; border:none; color:#ff4444; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
            `;
            list.appendChild(item);
            item.querySelector('.btn-del').onclick = async () => {
                if (confirm("Hapus chapter ini?")) {
                    await deleteDoc(doc(db, "chapters", c.id));
                    location.reload();
                }
            };
        });
    } catch (e) { console.error("Load Chapter Error:", e); }
}

// --- CREATE NEW SERIES ---
const btnCreate = document.getElementById('btn-create-series');
if (btnCreate) {
    btnCreate.onclick = async () => {
        const title = document.getElementById('comic-title').value;
        const file = document.getElementById('file-input').files[0];
        if (!title || !file) return alert("Judul dan Cover wajib ada!");

        btnCreate.disabled = true;
        btnCreate.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> Publishing...";

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
                writer: "", artist: "", createdAt: serverTimestamp()
            });

            alert("Karya berhasil dibuat!");
            location.reload();
        } catch (e) { alert(e.message); btnCreate.disabled = false; btnCreate.innerText = "Publish Series"; }
    };
}

const logoutBtn = document.getElementById('btn-logout');
if (logoutBtn) logoutBtn.onclick = () => signOut(auth).then(() => location.href='index.html');
