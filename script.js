// Mengambil elemen tombol dan teks
const tombol = document.getElementById('btn-cek');
const teksStatus = document.getElementById('status-text');

// Fungsi saat tombol diklik
tombol.addEventListener('click', () => {
    teksStatus.innerText = "Website ini sedang dipantau oleh CEO DebutCMC!";
    teksStatus.style.color = "#fbbf24";
    alert("Semangat Membangun DebutCMC!");
});
