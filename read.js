// ===== KONFIGURASI =====
const API_BASE = "https://shinei-api.vercel.app/api/v1";

// ===== DOM =====
const readerTitle = document.getElementById('reader-title');
const readerChapter = document.getElementById('reader-chapter');
const readerPages = document.getElementById('reader-pages');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// ===== STATE =====
let chapters = [];
let currentChapterIndex = 0;
let isLoading = false;

// ===== HELPER FETCH =====
async function fetchAPI(endpoint) {
  try {
    console.log(`[fetchAPI] Mencoba: ${endpoint}`);
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    console.log(`[fetchAPI] Response:`, json);
    return json;
  } catch (e) {
    console.error('API error:', e);
    return null;
  }
}

// ===== AMBIL SERIES + CHAPTER LIST =====
async function loadSeries(slug) {
  if (isLoading) return;
  isLoading = true;
  readerChapter.textContent = 'Memuat...';

  // Ambil data series dengan include chapters
  const data = await fetchAPI(`/series/${slug}?include=chapters`);
  if (!data || !data.data) {
    readerChapter.textContent = 'Gagal memuat series';
    readerPages.innerHTML = `
      <div class="page-placeholder">
        <div class="glyph">❌</div>
        <span>Gagal memuat data series. Pastikan slug benar.</span>
      </div>
    `;
    isLoading = false;
    return;
  }

  const series = data.data;
  readerTitle.textContent = series.title || series.name || 'Tanpa Judul';

  // Ambil chapters
  chapters = series.chapters || [];
  if (chapters.length === 0) {
    readerChapter.textContent = 'Tidak ada chapter';
    readerPages.innerHTML = `
      <div class="page-placeholder">
        <div class="glyph">📖</div>
        <span>Belum ada chapter untuk series ini.</span>
      </div>
    `;
    isLoading = false;
    return;
  }

  // Urutkan chapter berdasarkan order
  chapters.sort((a, b) => (a.order || 0) - (b.order || 0));

  // Buka chapter pertama
  currentChapterIndex = 0;
  await openChapter(currentChapterIndex);
  isLoading = false;
}

// ===== BUKA CHAPTER =====
async function openChapter(index) {
  if (isLoading) return;
  if (!chapters || index < 0 || index >= chapters.length) return;

  isLoading = true;
  const ch = chapters[index];
  const chId = ch.id || ch.chapter_id || ch.slug;

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

  const chTitle = ch.title || `Chapter ${ch.order || index + 1}`;
  readerChapter.textContent = chTitle;

  readerPages.innerHTML = `
    <div class="page-placeholder">
      <div class="glyph">⏳</div>
      <span>Memuat halaman chapter...</span>
    </div>
  `;

  // Ambil detail chapter
  const data = await fetchAPI(`/chapter/${chId}`);
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
  let images = detail.images || detail.pages || detail.image_list || [];

  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch (e) { images = []; }
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
