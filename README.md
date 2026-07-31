# AZAZOTHX Manhwa Archive

Web statis (HTML/CSS/JS, tanpa build step, tanpa login) buat baca manhwa dengan tampilan mobile-first ala app.

## 📁 Struktur Folder

```
azazothx-manhwa/
├── index.html          → markup utama halaman
├── styles.css          → semua styling
├── app.js               → render grid manhwa, klik card, bottom nav
├── assets/
│   └── azazothx-loop.webm  → video loop logo (di bawah navbar)
└── README.md            → file ini
```

## 🚀 Cara Deploy ke Vercel

1. Push folder ini ke GitHub repo baru
2. Buka vercel.com → New Project → Import repo tersebut
3. Framework preset: pilih **Other** (statis HTML, tanpa build command)
4. Deploy — selesai

## 📌 Catatan Penting

- **Data manhwa** di `app.js` (variabel `manhwaList`) masih contoh statis. Ganti dengan data asli dari sumbermu sendiri.
- **Cover gambar**: masih placeholder simbol (◉ ◉). Ganti `<div class="cover-glyph">` di `app.js` dengan `<img src="...">` begitu sumber gambar sudah siap.
- **Bottom nav** (Home / Cari / Setting) baru tampilan doang — fungsinya (pindah halaman/tab) perlu ditambahkan sendiri di `app.js` bagian `setupBottomNav()`.
- **Tanpa login/database** — jadi tidak ada riwayat baca yang tersimpan. Kalau nanti mau tambah fitur itu lagi, tinggal bilang, strukturnya gampang ditambahkan belakangan.
- Video `azazothx-loop.webm` sudah dikompres ke ~660KB, aman untuk mobile.
