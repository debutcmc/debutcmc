import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
    } else {
        document.getElementById('dashboard-ui').style.display = 'block';
        const path = window.location.pathname;
        if (path.includes('dashboard.html')) muatKomikSaya();
        if (path.includes('manage.html')) { muatDataSeries(); muatDaftarChapter(); }
    }
});

// --- DASHBOARD LOGIC ---
async function muatKomikSaya() {
    const list = document.getElementById('my-comic-list');
    const q = query(collection(db, "comics"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    list.innerHTML = "";
    snap.forEach(d => {
        if (d.data().authorId === auth.currentUser.uid) {
            list.innerHTML += `
                <div style="background:#161a21; padding:15px; border-radius:10px; display:flex; gap:15px; align-items:center; border:1px solid #333;">
                    <img src="${d.data().coverUrl}" style="width:50px; height:70px; object-fit:cover; border-radius:5px;">
                    <div style="flex-grow:1;">
                        <h4 style="margin:0;">${d.data().title}</h4>
                        <small style="color:#00ff88;">${d.data().status}</small>
                    </div>
                    <button onclick="location.href='manage.html?id=${d.id}'" style="background:#333; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Manage</button>
                </div>`;
        }
    });
}

// --- CREATE SERIES ---
const btnCreate = document.getElementById('btn-create-series');
if (btnCreate) {
    btnCreate.onclick = async () => {
        const title = document.getElementById('comic-title').value;
        const file = document.getElementById('file-input').files[0];
        if (!title || !file) return alert("Isi judul dan cover!");

        btnCreate.innerText = "Uploading...";
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch('https://api.imgbb.com/1/upload?key=daa2bcb021279c96cebd854f8650d77e', { method: 'POST', body: formData });
        const img = await res.json();

        await addDoc(collection(db, "comics"), {
            title,
            genre: document.getElementById('comic-genre').value,
            summary: document.getElementById('comic-summary').value,
            coverUrl: img.data.url,
            authorId: auth.currentUser.uid,
            status: "pending",
            createdAt: serverTimestamp()
        });
        alert("Berhasil!"); location.reload();
    };
}

// --- GLOBAL WINDOW FUNCTIONS ---
window.logout = () => signOut(auth).then(() => location.href='index.html');
