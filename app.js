// ===== KONFIGURASI =====
const API_BASE = "https://shinei-api.vercel.app/api/v1";

const FEATURED_SLUGS = [
  "solo-leveling",
  "nano-machine",
  "reincarnator",
  "eleceed",
  "omniscient-reader",
  "the-beginning-after-the-end",
];

// ===== FALLBACK DATA (kalo API gagal total) =====
const FALLBACK_SERIES = [
  { slug: "solo-leveling", title: "Solo Leveling", type: "Manhwa", status: "Completed", rating: "4.9" },
  { slug: "nano-machine", title: "Nano Machine", type: "Manhwa", status: "Ongoing", rating: "4.8" },
  { slug: "reincarnator", title: "Reincarnator", type: "Manhwa", status: "Ongoing", rating: "4.7" },
  { slug: "eleceed", title: "Eleceed", type: "Manhwa", status: "Ongoing", rating: "4.9" },
  { slug: "omniscient-reader", title: "Omniscient Reader", type: "Manhwa", status: "Completed", rating: "4.9" },
  { slug: "the-beginning-after-the-end", title: "The Beginning After The End", type: "Manhwa", status: "Ongoing", rating: "4.8" },
];

// ===== RENDER LOADING =====
function renderLoadingState(targetId) {
  const el = document.getElementById(targetId);
  el.innerHTML = Array.from({ length: 6 }).map(() => `
    <div class="card">
      <div class="cover">
        <div class="cover-glyph">◉ ◉</div>
      </div>
      <div class="card-body">
        <div class="card-title" style="opacity:0.4;">Memuat...</div>
      </div>
    </div>
  `).join("");
}

// ===== FETCH SERIES DENGAN TIMEOUT =====
async function fetchSeries(slug) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // timeout 8 detik

    const res = await fetch(`${API_BASE}/komikindo/api/komik/${slug}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 404) {
        console.warn(`Series "${slug}" tidak ditemukan.`);
        return null;
      }
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    const data = json.data || json;
    // Pastikan ada title
    if (!data.title) data.title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return data;
  } catch (err) {
    console.error(`Error fetch ${slug}:`, err.message);
    // Kalo error, pake fallback data
    const fallback = FALLBACK_SERIES.find(s => s.slug === slug);
    return fallback ? { ...fallback, slug } : null;
  }
}

// ===== AMBIL FEATURED SERIES =====
async function fetchFeaturedSeries() {
  const results = await Promise.all(FEATURED_SLUGS.map(fetchSeries));
  const filtered = results.filter(Boolean);
  if (filtered.length === 0) {
    // Kalo semua gagal, pake fallback total
    console.warn("Semua fetch gagal, pakai fallback data.");
    return FALLBACK_SERIES;
  }
  return filtered;
}

// ===== RENDER GRID =====
function renderGrid(targetId, seriesList, emptyMessage) {
  const el = document.getElementById(targetId);

  if (!seriesList || seriesList.length === 0) {
    el.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">${emptyMessage}</div>`;
    return;
  }

  el.innerHTML = seriesList.map(s => {
    const cover = s.cover?.small || s.cover?.large || s.thumbnail || s.image || s.cover_url || '';
    const title = s.title || s.name || 'Tanpa Judul';
    const type = s.type || s.genre || 'Manhwa';
    const chapters = s.chapters_count || s.chapter_count || s.total_chapters || '?';
    const rating = s.rating || s.score || '';

    return `
      <div class="card" data-series-slug="${s.slug || s.id || s.endpoint || ''}" data-series-title="${title}">
        <div class="cover">
          <img src="${cover}" alt="${title}" loading="lazy"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="cover-glyph" style="display:none; position:absolute; inset:0; align-items:center; justify-content:center;">◉ ◉</div>
          <div class="badge">${chapters ? `Ch. ${chapters}` : s.status || ''}</div>
        </div>
        <div class="card-body">
          <div class="card-title">${title}</div>
          <div class="card-meta"><span class="dot"></span>${type} ${rating ? `· ${rating}★` : ''}</div>
        </div>
      </div>
    `;
  }).join("");

  attachCardEvents(el);
}

// ===== ATTACH CLICK EVENT =====
function attachCardEvents(container) {
  container.querySelectorAll(".card[data-series-slug]").forEach(card => {
    card.addEventListener("touchstart", () => card.classList.add("hovered"));
    card.addEventListener("touchend", () => setTimeout(() => card.classList.remove("hovered"), 250));
    card.addEventListener("click", () => {
      const slug = card.dataset.seriesSlug;
      if (slug) {
        window.location.href = `read.html?series=${encodeURIComponent(slug)}`;
      }
    });
  });
}

// ===== BOTTOM NAV =====
function setupBottomNav() {
  // ... (sama seperti sebelumnya)
}

// ===== SEARCH =====
function setupSearchTab() {
  // ... (sama seperti sebelumnya)
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", async () => {
  renderLoadingState("grid-updates");
  setupBottomNav();
  setupSearchTab();

  try {
    const seriesList = await fetchFeaturedSeries();
    renderGrid("grid-updates", seriesList, "Gagal memuat data. Coba refresh halaman.");
  } catch (err) {
    console.error("Init error:", err);
    renderGrid("grid-updates", FALLBACK_SERIES, "Gagal memuat data. Menampilkan data cadangan.");
  }
});
