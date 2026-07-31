// === KONFIGURASI API ===
// Instance ShineiAPI milik sendiri (bukan server testing developer aslinya)
const API_BASE = "https://shinei-api.vercel.app/api/v1";

// Daftar slug manhwa yang mau ditampilkan di homepage "Baru Update"
const FEATURED_SLUGS = [
  "solo-leveling",
  "nano-machine",
  "reincarnator",
  "eleceed",
  "omniscient-reader",
  "the-beginning-after-the-end",
];

function renderLoadingState() {
  const el = document.getElementById("grid-updates");
  el.innerHTML = Array.from({ length: 6 }).map(() => `
    <div class="card">
      <div class="cover">
        <div class="cover-glyph">&#9673; &#9673;</div>
      </div>
      <div class="card-body">
        <div class="card-title" style="opacity:0.4;">Memuat...</div>
      </div>
    </div>
  `).join("");
}

async function fetchSeries(slug) {
  try {
    const res = await fetch(`${API_BASE}/series/${slug}`);
    const json = await res.json();
    if (json.success) return json.data;
    console.warn(`Gagal ambil data untuk ${slug}:`, json.error?.message);
    return null;
  } catch (err) {
    console.error(`Error fetch ${slug}:`, err);
    return null;
  }
}

async function fetchFeaturedSeries() {
  const results = await Promise.all(FEATURED_SLUGS.map(fetchSeries));
  return results.filter(Boolean);
}

function renderUpdatesGrid(seriesList) {
  const el = document.getElementById("grid-updates");

  if (!seriesList || seriesList.length === 0) {
    el.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">Gagal memuat data. Coba refresh halaman.</div>`;
    return;
  }

  el.innerHTML = seriesList.map(s => `
    <div class="card" data-series-slug="${s.slug}" data-series-title="${s.title}">
      <div class="cover">
        <img src="${s.cover?.small || s.cover?.large || ''}" alt="${s.title}" loading="lazy"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="cover-glyph" style="display:none; position:absolute; inset:0; align-items:center; justify-content:center;">&#9673; &#9673;</div>
        <div class="badge">${s.chapters_count ? `Ch. ${s.chapters_count}` : s.status || ''}</div>
      </div>
      <div class="card-body">
        <div class="card-title">${s.title}</div>
        <div class="card-meta"><span class="dot"></span>${s.type || 'Manhwa'} ${s.rating ? `· ${s.rating}★` : ''}</div>
      </div>
    </div>
  `).join("");

  attachCardEvents(el);
}

function attachCardEvents(container) {
  container.querySelectorAll(".card[data-series-slug]").forEach(card => {
    card.addEventListener("touchstart", () => card.classList.add("hovered"));
    card.addEventListener("touchend", () => setTimeout(() => card.classList.remove("hovered"), 250));
    card.addEventListener("click", () => {
      const { seriesSlug } = card.dataset;
      window.location.href = `read.html?series=${seriesSlug}`;
    });
  });
}

function setupBottomNav() {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      console.log("Tab aktif:", item.dataset.tab);
    });
  });
}

function setupSearch() {
  const input = document.querySelector(".search-box input");
  if (!input) return;

  let debounceTimer;
  input.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    if (query.length < 2) return;

    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) {
          renderUpdatesGrid(json.data);
        }
      } catch (err) {
        console.error("Search error:", err);
      }
    }, 400);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  renderLoadingState();
  setupBottomNav();
  setupSearch();

  const seriesList = await fetchFeaturedSeries();
  renderUpdatesGrid(seriesList);
});
