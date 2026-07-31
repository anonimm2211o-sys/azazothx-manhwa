// ===== KONFIGURASI API PRIBADI (DEPLOYMENT VERCEL KAMU) =====
const API_BASE = "https://komiku-rest-api-roan.vercel.app";

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

  const data = await fetchAPI(`${API_BASE}/detail-komik/${slug}`);
  const comicData = data?.data || data;
  
  if (!comicData) {
    readerChapter.textContent = 'Gagal memuat series';
    readerPages.innerHTML = `
      <div class="page-placeholder">
        <div class="glyph">❌</div>
        <span>Gagal mengambil data komik dari API pribadi.</span>
      </div>
    `;
    isLoading = false;
    return;
  }

  readerTitle.textContent = comicData.title || comicData.name || 'Tanpa Judul';
  chapters = comicData.chapters || comicData.chapter_list || [];
  
  if (chapters.length === 0) {
    readerChapter.textContent = 'Tidak ada chapter';
    readerPages.innerHTML = `
      <div class="page-placeholder">
        <div class="glyph">📖</div>
        <span>Belum ada chapter yang tersedia untuk komik ini.</span>
      </div>
    `;
    isLoading = false;
    return;
  }

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
  const chTitle = ch.title || ch.name || `Chapter ${index + 1}`;
  readerChapter.textContent = chTitle;

  readerPages.innerHTML = `
    <div class="page-placeholder">
      <div class="glyph">⏳</div>
      <span>Memuat gambar halaman...</span>
    </div>
  `;

  window.scrollTo(0, 0);

  const chapterPath = ch.endpoint || ch.url || ch.slug || ch.link;
  if (!chapterPath) {
    readerPages.innerHTML = `
      <div class="page-placeholder">
        <div class="glyph">❌</div>
        <span>Endpoint chapter tidak valid.</span>
      </div>
    `;
    isLoading = false;
    updateNavButtons();
    return;
  }

  let cleanPath = chapterPath.replace(/^\/+/g, '');
  if (cleanPath.startsWith('baca-chapter/')) {
    cleanPath = cleanPath.replace('baca-chapter/', '');
  }

  const data = await fetchAPI(`${API_BASE}/baca-chapter/${cleanPath}`);
  const chapterData = data?.data || data;
  const images = chapterData?.images || chapterData?.gambar || chapterData?.chapter_image || [];

  if (!images || images.length === 0) {
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
