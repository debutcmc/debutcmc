// 1. IMPORT FIREBASE (Gunakan Versi CDN agar Simpel)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. CONFIG MILIK KAMU (CEO DEBUTCMC)
const firebaseConfig = {
  apiKey: "AIzaSyCt2j9hATOmWYqdknCi05j8zIO59SaF578",
  authDomain: "debutcmc-ec2ad.firebaseapp.com",
  projectId: "debutcmc-ec2ad",
  storageBucket: "debutcmc-ec2ad.firebasestorage.app",
  messagingSenderId: "283108871954",
  appId: "1:283108871954:web:5900298201e74ce83d2dcb"
};

// 3. INISIALISASI
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. LOGIKA UPLOAD (IMGBB + FIREBASE)
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-trigger');
const statusText = document.getElementById('upload-status');
const previewImg = document.getElementById('image-preview');

if (uploadBtn) {
    uploadBtn.addEventListener('click', () => fileInput.click());
}

if (fileInput) {
    fileInput.addEventListener('change', async function() {
        const file = this.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        statusText.innerText = "🚀 Mengunggah ke ImgBB...";
        uploadBtn.disabled = true;

        try {
            // STEP 1: UPLOAD KE IMGBB
            const response = await fetch('https://api.imgbb.com/1/upload?key=daa2bcb021279c96cebd854f8650d77e', {
                method: 'POST',
                body: formData
            });
            const hasil = await response.json();

            if (hasil.status === 200) {
                const linkGambar = hasil.data.url;
                statusText.innerText = "✅ Gambar Berhasil di ImgBB! Sekarang mendaftarkan ke Database...";

                // STEP 2: SIMPAN LINK KE FIREBASE FIRESTORE
                await addDoc(collection(db, "comics"), {
                    title: "Komik Baru " + Date.now(), // Nama sementara
                    imageUrl: linkGambar,
                    createdAt: serverTimestamp()
                });

                statusText.innerHTML = `🔥 SUKSES TOTAL! <br> Komik sudah terdaftar di Firebase. <br> <a href="${linkGambar}" target="_blank" style="color:#00ff88">Lihat Gambar</a>`;
                previewImg.src = hasil.data.display_url;
                previewImg.style.display = 'block';
            }
        } catch (error) {
            statusText.innerText = "❌ Terjadi kesalahan sistem!";
            console.error(error);
        } finally {
            uploadBtn.disabled = false;
        }
    });
}
