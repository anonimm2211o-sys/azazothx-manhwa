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

// ===== FETCH SERIES (FIX ENDPOINT) =====
async function fetchSeries(slug) {
  try {
    // ENDPOINT YANG BENAR: /komikindo/api/komik/{slug}
    const res = await fetch(`${API_BASE}/komikindo/api/komik/${slug}`);
    if (!res.ok) {
      if (res.status === 404) {
        console.warn(`Series "${slug}" tidak ditemukan.`);
        return null;
      }
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    // ShineiAPI biasanya bungkus di { data: {...} }
    const data = json.data || json;
    return data;
  } catch (err) {
    console.error(`Error fetch ${slug}:`, err);
    return null;
  }
}

// ===== AMBIL FEATURED SERIES =====
async function fetchFeaturedSeries() {
  const results = await Promise.all(FEATURED_SLUGS.map(fetchSeries));
  return results.filter(Boolean);
}

// ===== RENDER GRID =====
function renderGrid(targetId, seriesList, emptyMessage) {
  const el = document.getElementById(targetId);

  if (!seriesList || seriesList.length === 0) {
    el.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">${emptyMessage}</div>`;
    return;
  }

  el.innerHTML = seriesList.map(s => {
    // Ambil cover dari berbagai kemungkinan field
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

      if (targetTab === "search") {
        const searchInput = document.getElementById("search-input-tab");
        if (searchInput) searchInput.focus();
      }
    });
  });
}

// ===== SEARCH (FIX ENDPOINT) =====
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
        // ENDPOINT YANG BENAR: /komikindo/api/cari/{query}/page/1
        const res = await fetch(`${API_BASE}/komikindo/api/cari/${encodeURIComponent(query)}/page/1`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        // ShineiAPI bungkus di { data: { list: [...] } } atau { data: [...] }
        let results = [];
        if (json.data && json.data.list) {
          results = json.data.list;
        } else if (json.data && Array.isArray(json.data)) {
          results = json.data;
        } else if (json.list && Array.isArray(json.list)) {
          results = json.list;
        } else {
          results = [];
        }
        renderGrid("grid-search-results", results, "Tidak ada hasil ditemukan.");
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

  const seriesList = await fetchFeaturedSeries();
  renderGrid("grid-updates", seriesList, "Gagal memuat data. Coba refresh halaman.");
});
