<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Series | DebutCMC</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body style="background: #0b0e14; color: white; font-family: sans-serif; margin: 0;">

    <div id="manage-ui" style="max-width: 800px; margin: 0 auto; padding: 20px;">
        
        <header style="display: flex; align-items: center; gap: 15px; margin-bottom: 30px;">
            <button onclick="window.location.href='dashboard.html'" style="background: #161a21; border: 1px solid #333; color: white; padding: 10px; border-radius: 50%; cursor: pointer; width: 40px; height: 40px;">←</button>
            <div>
                <h1 id="manage-title" style="margin: 0; font-size: 20px; color: #00ff88;">Memuat Judul...</h1>
                <p style="margin: 0; font-size: 12px; color: #8b949e;">Management Center</p>
            </div>
        </header>

        <div id="series-info" style="display: flex; gap: 20px; background: #161a21; padding: 20px; border-radius: 15px; border: 1px solid #2d333b; margin-bottom: 30px;">
            <img id="series-cover" src="" style="width: 100px; height: 100px; object-fit: cover; border-radius: 10px; background: #0b0e14;">
            <div>
                <h2 id="info-title" style="margin: 0 0 5px 0;">-</h2>
                <span id="info-genre" style="color: #00ff88; font-size: 12px; font-weight: bold; background: rgba(0,255,136,0.1); padding: 3px 8px; border-radius: 5px;">-</span>
                <p id="info-summary" style="font-size: 13px; color: #8b949e; margin-top: 10px; line-height: 1.4;">-</p>
            </div>
        </div>

        <section style="background: #161a21; padding: 25px; border-radius: 15px; border: 1px solid #2d333b; margin-bottom: 30px;">
            <h3 style="margin-top: 0; color: #00ff88;">➕ Upload Chapter Baru</h3>
            
            <label style="display:block; margin-bottom:8px; font-size:12px; color:#8b949e;">NOMOR/JUDUL CHAPTER</label>
            <input type="text" id="chapter-title" placeholder="Contoh: Chapter 01: Pertemuan" style="width: 100%; padding: 12px; margin-bottom: 20px; background: #0b0e14; border: 1px solid #333; color: white; border-radius: 8px;">

            <label style="display:block; margin-bottom:8px; font-size:12px; color:#8b949e;">GAMBAR KOMIK (Multiple Images)</label>
            <div id="drop-zone" style="border: 2px dashed #333; padding: 30px; text-align: center; border-radius: 10px; cursor: pointer; background: #0b0e14;">
                <p id="upload-status">📁 Klik untuk pilih gambar chapter</p>
                <input type="file" id="chapter-files" accept="image/*" multiple style="display: none;">
            </div>
            <p style="font-size: 11px; color: #444; margin-top: 5px;">*Urutan gambar sesuai dengan nama file atau saat dipilih.</p>

            <button id="btn-upload-chapter" style="width: 100%; margin-top: 20px; background: #00ff88; color: black; border: none; padding: 15px; font-weight: bold; border-radius: 8px; cursor: pointer;">Publish Chapter</button>
        </section>

        <section>
            <h3 style="border-left: 4px solid #00ff88; padding-left: 15px;">Daftar Chapter</h3>
            <div id="chapter-list" style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px;">
                <p style="color: #444;">Belum ada chapter.</p>
            </div>
        </section>

    </div>

    <script type="module" src="js/manage.js"></script>
</body>
</html>
