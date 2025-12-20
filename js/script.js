// 1. IMPORT FIREBASE (Versi CDN Module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// 4. LOGIKA UPLOAD (IMGBB + FIREBASE)
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-trigger');
const statusText = document.getElementById('upload-status');
const previewImg = document.getElementById('image-preview');

// Pastikan elemen ada sebelum menjalankan event listener (mencegah error di halaman non-admin)
if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async function() {
        const file = this.files[0];
        const judulInput = document.getElementById('comic-title');
        const genreInput = document.getElementById('comic-genre');

        if (!file) return;

        // Validasi: Pastikan judul sudah diisi sebelum upload
        if (judulInput && !judulInput.value) {
            alert("Harap isi Judul Komik terlebih dahulu!");
            this.value = ""; // Reset file input
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        statusText.innerText = "🚀 Mengunggah gambar ke ImgBB...";
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
                const judul = judulInput ? judulInput.value : "Tanpa Judul";
                const genre = genreInput ? genreInput.value : "Umum";

                statusText.innerText = "✅ Gambar aman! Mendaftarkan ke Database...";

                // STEP 2: SIMPAN DATA LENGKAP KE FIREBASE FIRESTORE
                await addDoc(collection(db, "comics"), {
                    title: judul,
                    genre: genre,
                    coverUrl: linkGambar,
                    createdAt: serverTimestamp()
                });

                statusText.innerHTML = `🔥 BERHASIL DIRILIS! <br> Komik "${judul}" sudah tayang di Database.`;
                previewImg.src = hasil.data.display_url;
                previewImg.style.display = 'block';
                
                // Reset form setelah sukses
                if(judulInput) judulInput.value = "";
            } else {
                statusText.innerText = "❌ Gagal Upload: " + hasil.error.message;
            }
        } catch (error) {
            statusText.innerText = "❌ Terjadi kesalahan koneksi!";
            console.error(error);
        } finally {
            uploadBtn.disabled = false;
        }
    });
}
