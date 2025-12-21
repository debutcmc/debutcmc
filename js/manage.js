import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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

onAuthStateChanged(auth, (user) => {
    if (!user) {
        document.getElementById('auth-overlay').style.display = 'block';
        document.getElementById('dashboard-ui').style.display = 'none';
    } else {
        document.getElementById('auth-overlay').style.display = 'none';
        document.getElementById('dashboard-ui').style.display = 'block';
        
        const path = window.location.pathname;
        if (path.includes('dashboard.html')) muatKomikSaya();
    }
});

// --- LOAD MY COMICS ---
async function muatKomikSaya() {
    const list = document.getElementById('my-comic-list');
    if (!list) return;

    try {
        // Query langsung filter berdasarkan authorId agar lebih cepat & efisien
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
    } catch (e) {
        console.error("Gagal muat komik:", e);
        list.innerHTML = "<p style='color:red;'>Gagal mengambil data.</p>";
    }
}

// --- CREATE SERIES ---
const btnCreate = document.getElementById('btn-create-series');
if (btnCreate) {
    btnCreate.onclick = async () => {
        const title = document.getElementById('comic-title').value;
        const file = document.getElementById('file-input').files[0];
        
        if (!title || !file) return alert("Mohon lengkapi judul dan cover!");

        btnCreate.disabled = true;
        btnCreate.innerText = "Processing & Uploading...";

        try {
            const formData = new FormData();
            formData.append('image', file);
            
            const res = await fetch('https://api.imgbb.com/1/upload?key=daa2bcb021279c96cebd854f8650d77e', { 
                method: 'POST', 
                body: formData 
            });
            const imgData = await res.json();

            if (!imgData.success) throw new Error("Gagal upload gambar ke ImgBB");

            await addDoc(collection(db, "comics"), {
                title: title,
                genre: document.getElementById('comic-genre').value,
                summary: document.getElementById('comic-summary').value,
                coverUrl: imgData.data.url,
                authorId: auth.currentUser.uid,
                status: "published", // Langsung published biar muncul di home
                createdAt: serverTimestamp()
            });

            alert("Karya berhasil diterbitkan!");
            location.reload();
        } catch (e) {
            alert("Error: " + e.message);
            btnCreate.disabled = false;
            btnCreate.innerText = "Publish Series Now";
        }
    };
}

// --- LOGOUT ---
document.getElementById('btn-logout').onclick = () => {
    signOut(auth).then(() => location.href='index.html');
};
