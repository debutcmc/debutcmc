// Fungsi untuk Upload Gambar ke ImgBB
async function uploadKeImgBB(fileGambar) {
    const apiKey = 'daa2bcb021279c96cebd854f8650d77e'; // Sementara di sini, tapi nanti kita amankan
    const formData = new FormData();
    formData.append('image', fileGambar);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        console.log("Link Gambar Kamu:", data.data.url);
        return data.data.url;
    } catch (error) {
        console.error("Upload Gagal!", error);
    }
}
