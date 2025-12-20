const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-trigger');
const statusText = document.getElementById('upload-status');
const previewImg = document.getElementById('image-preview');

// Trigger input file saat tombol diklik
uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async function() {
    const file = this.files[0];
    if (!file) return;

    // Persiapan data sesuai dokumentasi (POST & multipart/form-data)
    const formData = new FormData();
    formData.append('image', file);

    statusText.innerText = "Sedang mengunggah ke server...";
    uploadBtn.disabled = true;

    try {
        // Pemanggilan API v1 (Sesuai instruksi: Metode POST)
        const response = await fetch('https://api.imgbb.com/1/upload?key=daa2bcb021279c96cebd854f8650d77e', {
            method: 'POST',
            body: formData
        });

        const hasil = await response.json();

        if (hasil.status === 200) {
            statusText.innerHTML = `✅ Berhasil! <br> <a href="${hasil.data.url}" target="_blank" style="color:#38bdf8">Lihat Link Gambar</a>`;
            previewImg.src = hasil.data.display_url;
            previewImg.style.display = 'block';
            console.log("Data JSON Lengkap:", hasil);
        } else {
            statusText.innerText = "Gagal: " + hasil.error.message;
        }
    } catch (error) {
        statusText.innerText = "Koneksi Error!";
        console.error(error);
    } finally {
        uploadBtn.disabled = false;
    }
});
