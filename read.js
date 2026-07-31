// ===== KONFIGURASI =====
const API_BASE = "https://shinei-api.vercel.app/api/v1";

// Menggunakan proxy alternatif yang lebih longgar untuk bypass CORS
const CORS_PROXY = "https://api.codetabs.com/v1/proxy?quest=";

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

// ===== HELPER FETCH API EXTERNAL =====
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

// ===== AMBIL SERIES + CHAPTER LIST =====
async function loadSeries(slug) {
  if (isLoading) return;
  isLoading = true;
  readerChapter.textContent = 'Memuat...';

  const data = await fetchAPI(`/series/${slug}?include=chapters`);
  if (!data || !data.data) {
    readerChapter.textContent = 'Gagal memuat series';
    readerPages.innerHTML = `
      <div class="page-placeholder">
        <div class="glyph">❌</div>
        <span>Gagal memuat data series dari API.</span>
      </div>
    `;
    isLoading = false;
    return;
  }

  const series = data.data;
  readerTitle.textContent = series.title || series.name || 'Tanpa Judul';

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

  chapters.sort((a, b) => (a.order || 0) - (b.order || 0));

  currentChapterIndex = 0;
  await openChapter(currentChapterIndex);
  isLoading = false;
}

// ===== BUKA CHAPTER & SCRAPE GAMBAR =====
async function openChapter(index) {
  if (isLoading) return;
  if (!chapters || index < 0 || index >= chapters.length) return;

  isLoading = true;
  const ch = chapters[index];
  const targetChapterUrl = ch.url || ch.link || ch.endpoint;

  const chTitle = ch.title || `Chapter ${ch.order || index + 1}`;
  readerChapter.textContent = chTitle;

  readerPages.innerHTML = `
    <div class="page-placeholder">
      <div class="glyph">⏳</div>
      <span>Mengambil halaman chapter...</span>
    </div>
  `;

  window.scrollTo(0, 0);

  try {
    if (!targetChapterUrl) {
      throw new Error("URL chapter tidak ditemukan.");
    }

    const response = await fetch(CORS_PROXY + encodeURIComponent(targetChapterUrl));
    const htmlText = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const images = [];
    
    // Ambil semua tag gambar di halaman lalu filter yang berukuran besar/potensial halaman komik
    doc.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
      if (src) {
        const cleanSrc = src.trim();
        // Hindari ikon kecil, avatar, atau logo situs
        if (!cleanSrc.includes('logo') && !cleanSrc.includes('icon') && !images.includes(cleanSrc)) {
          images.push(cleanSrc);
        }
      }
    });

    if (images.length === 0) {
      readerPages.innerHTML = `
        <div class="page-placeholder">
          <div class="glyph">🖼️</div>
          <span>Tidak ada gambar yang terdeteksi di halaman ini.</span>
        </div>
      `;
    } else {
      renderImages(images);
    }
  } catch (err) {
    console.error("Gagal scrape chapter:", err);
    readerPages.innerHTML = `
      <div class="page-placeholder">
        <div class="glyph">❌</div>
        <span>Gagal memuat gambar chapter.</span>
      </div>
    `;
  }

  updateNavButtons();
  isLoading = false;
}

// ===== RENDER GAMBAR KE HALAMAN =====
function renderImages(images) {
  readerPages.innerHTML = '';
  images.forEach(url => {
    if (!url) return;
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
