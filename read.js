// ===== KONFIGURASI API KOMIK INDONESIA =====
const API_BASE = "https://komiku-api.fly.dev/api/comic";

// ===== DOM ELEMENTS =====
const readerTitle = document.getElementById('reader-title');
const readerChapter = document.getElementById('reader-chapter');
const readerPages = document.getElementById('reader-pages');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// ===== STATE =====
let chapters = [];
let currentChapterIndex = 0;
let isLoading = false;

// ===== HELPER FETCH API =====
async function fetchAPI(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('API Fetch Error:', e);
    return null;
  }
}

// ===== AMBIL DETAIL SERIES & LIST CHAPTER =====
async function loadSeries(slug) {
  if (isLoading) return;
  isLoading = true;
  readerChapter.textContent = 'Memuat chapter...';

  // Endpoint info series Komikku API: /info/{slug}
  const data = await fetchAPI(`${API_BASE}/info/${slug}`);
  
  if (!data || !data.data) {
    readerChapter.textContent = 'Gagal memuat series';
    readerPages.innerHTML = `
      <div class="page-placeholder">
        <div class="glyph">❌</div>
        <span>Gagal mengambil data komik dari server API.</span>
      </div>
    `;
    isLoading = false;
    return;
  }

  const series = data.data;
  readerTitle.textContent = series.title || 'Tanpa Judul';

  // Ambil daftar chapter dari respons API
  chapters = series.chapters || series.chapter_list || [];
  
  if (chapters.length === 0) {
    readerChapter.textContent = 'Tidak ada chapter';
    readerPages.innerHTML = `
      <div class="page-placeholder">
        <div class="glyph">📖</div>
        <span>Belum ada chapter yang tersedia.</span>
      </div>
    `;
    isLoading = false;
    return;
  }

  // Sesuaikan urutan chapter (dari awal ke akhir)
  chapters.reverse();

  currentChapterIndex = 0;
  await openChapter(currentChapterIndex);
  isLoading = false;
}

// ===== BUKA & RENDER CHAPTER GAMBAR =====
async function openChapter(index) {
  if (isLoading) return;
  if (!chapters || index < 0 || index >= chapters.length) return;

  isLoading = true;
  const ch = chapters[index];
  const chTitle = ch.title || `Chapter ${index + 1}`;
  readerChapter.textContent = chTitle;

  readerPages.innerHTML = `
    <div class="page-placeholder">
      <div class="glyph">⏳</div>
      <span>Memuat gambar halaman...</span>
    </div>
  `;

  window.scrollTo(0, 0);

  // Endpoint detail chapter Komikku API: /chapter{endpoint}
  const chapterEndpoint = ch.endpoint || ch.url || ch.link;
  const data = await fetchAPI(`${API_BASE}/chapter${chapterEndpoint}`);

  if (!data || !data.data || !data.data.images) {
    readerPages.innerHTML = `
      <div class="page-placeholder">
        <div class="glyph">❌</div>
        <span>Gagal memuat gambar halaman chapter.</span>
      </div>
    `;
    isLoading = false;
    updateNavButtons();
    return;
  }

  const images = data.data.images;
  renderImages(images);
  updateNavButtons();
  isLoading = false;
}

// ===== RENDER GAMBAR KE HALAMAN BACA =====
function renderImages(images) {
  readerPages.innerHTML = '';
  images.forEach(url => {
    if (!url) return;
    const img = document.createElement('img');
    img.src = url.trim();
    img.alt = 'Halaman Komik';
    img.loading = 'lazy';
    img.onerror = () => {
      const placeholder = document.createElement('div');
      placeholder.className = 'page-placeholder';
      placeholder.innerHTML = `
        <div class="glyph">🖼️</div>
        <span>Gagal memuat gambar</span>
      `;
      img.replaceWith(placeholder);
    };
    readerPages.appendChild(img);
  });
}

// ===== KONTROL NAVIGASI =====
function updateNavButtons() {
  prevBtn.disabled = currentChapterIndex <= 0;
  nextBtn.disabled = currentChapterIndex >= chapters.length - 1;
}

prevBtn.addEventListener('click', () => {
  if (currentChapterIndex > 0) {
    currentChapterIndex--;
    openChapter(currentChapterIndex);
  }
});

nextBtn.addEventListener('click', () => {
  if (currentChapterIndex < chapters.length - 1) {
    currentChapterIndex++;
    openChapter(currentChapterIndex);
  }
});

// ===== INISIALISASI HALAMAN =====
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('series');
  
  if (slug) {
    loadSeries(slug);
  } else {
    readerTitle.textContent = 'Series Tidak Ditemukan';
    readerChapter.textContent = 'Parameter URL Kosong';
    readerPages.innerHTML = `
      <div class="page-placeholder">
        <div class="glyph">⚠️</div>
        <span>Silakan kembali ke beranda dan pilih komik terlebih dahulu.</span>
      </div>
    `;
  }
});
