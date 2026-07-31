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

// ===== FALLBACK DATA =====
const FALLBACK_SERIES = [
  { slug: "solo-leveling", title: "Solo Leveling", cover: { small: "https://via.placeholder.com/200x300?text=Solo+Leveling" }, type: "Manhwa", status: "Completed", rating: "4.9" },
  { slug: "nano-machine", title: "Nano Machine", cover: { small: "https://via.placeholder.com/200x300?text=Nano+Machine" }, type: "Manhwa", status: "Ongoing", rating: "4.8" },
  { slug: "reincarnator", title: "Reincarnator", cover: { small: "https://via.placeholder.com/200x300?text=Reincarnator" }, type: "Manhwa", status: "Ongoing", rating: "4.7" },
  { slug: "eleceed", title: "Eleceed", cover: { small: "https://via.placeholder.com/200x300?text=Eleceed" }, type: "Manhwa", status: "Ongoing", rating: "4.9" },
  { slug: "omniscient-reader", title: "Omniscient Reader", cover: { small: "https://via.placeholder.com/200x300?text=Omniscient+Reader" }, type: "Manhwa", status: "Completed", rating: "4.9" },
  { slug: "the-beginning-after-the-end", title: "The Beginning After The End", cover: { small: "https://via.placeholder.com/200x300?text=TBATE" }, type: "Manhwa", status: "Ongoing", rating: "4.8" },
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

// ===== FETCH SERIES (ENDPOINT /series/) =====
async function fetchSeries(slug) {
  try {
    console.log(`[fetchSeries] Mencoba ambil: ${slug}`);
    const res = await fetch(`${API_BASE}/series/${slug}`);
    if (!res.ok) {
      console.warn(`[fetchSeries] ${slug} → HTTP ${res.status}`);
      return null;
    }
    const json = await res.json();
    console.log(`[fetchSeries] ${slug} → data:`, json);
    if (json.success && json.data) {
      return json.data;
    } else {
      console.warn(`[fetchSeries] ${slug} → success false atau data kosong`);
      return null;
    }
  } catch (err) {
    console.error(`[fetchSeries] ${slug} error:`, err.message);
    return null;
  }
}

// ===== AMBIL FEATURED SERIES =====
async function fetchFeaturedSeries() {
  const results = await Promise.all(FEATURED_SLUGS.map(fetchSeries));
  const filtered = results.filter(Boolean);
  if (filtered.length === 0) {
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
    const title = s.title || s.name || s.judul || 'Tanpa Judul';
    const type = s.type || s.genre || 'Manhwa';
    const chapters = s.chapters_count || s.chapter_count || s.total_chapters || '?';
    const rating = s.rating || s.score || '';
    const slug = s.slug || s.id || s.endpoint || '';

    return `
      <div class="card" data-series-slug="${slug}" data-series-title="${title}">
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
  const navItems = document.querySelectorAll(".nav-item");
  const tabPages = {
    home: document.getElementById("tab-home"),
    search: document.getElementById("tab-search"),
    settings: document.getElementById("tab-settings"),
  };

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const targetTab = item.dataset.tab;
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      Object.keys(tabPages).forEach(key => {
        if (tabPages[key]) {
          tabPages[key].style.display = key === targetTab ? "block" : "none";
        }
      });
      window.scrollTo(0, 0);
    });
  });
}

// ===== SEARCH =====
function setupSearchTab() {
  const input = document.getElementById("search-input-tab");
  const emptyState = document.getElementById("search-empty");
  const gridResults = document.getElementById("grid-search-results");
  if (!input) return;

  let debounceTimer;
  input.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();

    if (query.length < 2) {
      gridResults.innerHTML = "";
      if (emptyState) {
        emptyState.style.display = "block";
        emptyState.textContent = "Ketik minimal 2 huruf untuk mulai mencari.";
      }
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success && json.data) {
          renderGrid("grid-search-results", json.data, "Tidak ada hasil ditemukan.");
        } else {
          renderGrid("grid-search-results", [], "Tidak ada hasil ditemukan.");
        }
      } catch (err) {
        console.error("Search error:", err);
        if (emptyState) {
          emptyState.style.display = "block";
          emptyState.textContent = "Gagal mencari. Coba lagi.";
        }
      }
    }, 400);
  });
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
