// ===== KONFIGURASI =====
const API_BASE = "https://shinei-api.vercel.app/api/v1";

// ===== DOM =====
const readerTitle = document.getElementById('reader-title');
const readerChapter = document.getElementById('reader-chapter');
const readerPages = document.getElementById('reader-pages');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// ===== STATE =====
let seriesSlug = '';
let seriesData = null;
let chapters = [];
let currentChapterIndex = 0;
let isLoading = false;

// ===== HELPER FETCH =====
async function fetchAPI(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('API error:', e);
    return null;
  }
}

// ===== AMBIL DATA SERIES + CHAPTER LIST =====
async function loadSeries(slug) {
  if (isLoading) return;
  isLoading = true;
  readerChapter.textContent = 'Memuat...';

  // 1. Ambil detail series
  const data = await fetchAPI(`/komikindo/api/komik/${slug}`);
  if (!data || !data.data) {
    readerChapter.textContent = 'Gagal memuat series';
    isLoading = false;
    return;
  }

  seriesData = data.data;
  const title = seriesData.title || seriesData.name || 'Tanpa Judul';
  readerTitle.textContent = title;

  // 2. Ambil daftar chapter
  const chapData = await fetchAPI(`/komikindo/api/chapter/${slug}`);
  if (chapData && chapData.data) {
    if (Array.isArray(chapData.data)) {
      chapters = chapData.data;
    } else if (chapData.data.chapters && Array.isArray(chapData.data.chapters)) {
      chapters = chapData.data.chapters;
    } else {
      chapters = [chapData.data];
    }
  } else {
    // Fallback: coba ambil dari series object
    if (seriesData.chapters && Array.isArray(seriesData.chapters)) {
      chapters = seriesData.chapters;
    } else if (seriesData.chapter_list && Array.isArray(seriesData.chapter_list)) {
      chapters = seriesData.chapter_list;
    } else {
      chapters = [];
    }
  }

  // 3. Buka chapter pertama
  if (chapters.length > 0) {
    currentChapterIndex = 0;
    await openChapter(currentChapterIndex);
  } else {
    readerPages.innerHTML = `
      <div class="page-placeholder">
        <div class="glyph">📖</div>
        <span>Belum ada chapter untuk series ini.</span>
      </div>
    `;
    readerChapter.textContent = 'Tidak ada chapter';
  }

  isLoading = false;
}

// ===== BUKA CHAPTER =====
async function openChapter(index) {
  if (isLoading) return;
  if (!chapters || index < 0 || index >= chapters.length) return;

  isLoading = true;
  const ch = chapters[index];
  const chId = ch.chapter_id || ch.id || ch.endpoint || ch.slug;

  if (!chId) {
    readerPages.innerHTML = `
      <div class="page-placeholder">
        <div class="glyph">⚠️</div>
        <span>ID chapter tidak valid.</span>
      </div>
    `;
    isLoading = false;
    return;
  }

  const chTitle = ch.chapter_title || ch.title || `Chapter ${ch.chapter || index + 1}`;
  readerChapter.textContent = chTitle;

  readerPages.innerHTML = `
    <div class="page-placeholder">
      <div class="glyph">⏳</div>
      <span>Memuat halaman chapter...</span>
    </div>
  `;

  // Ambil detail chapter
  const data = await fetchAPI(`/komikindo/api/chapter/${chId}`);
  if (!data || !data.data) {
    readerPages.innerHTML = `
      <div class="page-placeholder">
        <div class="glyph">❌</div>
        <span>Gagal memuat chapter.</span>
      </div>
    `;
    isLoading = false;
    return;
  }

  const detail = data.data;
  let images = detail.images || detail.chapter_images || detail.image_list || detail.pages || [];

  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch (e) { images = []; }
  }

  if (!Array.isArray(images) || images.length === 0) {
    if (detail.img_array && Array.isArray(detail.img_array)) images = detail.img_array;
    else if (detail.gambar && Array.isArray(detail.gambar)) images = detail.gambar;
  }

  if (!images || images.length === 0) {
    readerPages.innerHTML = `
      <div class="page-placeholder">
        <div class="glyph">🖼️</div>
        <span>Tidak ada gambar di chapter ini.</span>
      </div>
    `;
  } else {
    renderImages(images);
  }

  updateNavButtons();
  isLoading = false;
}

// ===== RENDER GAMBAR =====
function renderImages(images) {
  readerPages.innerHTML = '';
  images.forEach(url => {
    if (!url || url.trim() === '') return;
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Halaman chapter';
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

// ===== NAVIGASI =====
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

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('series');
  if (slug) {
    seriesSlug = slug;
    loadSeries(slug);
  } else {
    readerTitle.textContent = 'Series tidak ditemukan';
    readerChapter.textContent = 'Parameter series hilang';
    readerPages.innerHTML = `
      <div class="page-placeholder">
        <div class="glyph">❌</div>
        <span>Gagal memuat series. Kembali ke beranda.</span>
      </div>
    `;
  }
});
