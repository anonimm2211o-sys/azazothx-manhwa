// === DATA MANHWA (contoh — ganti dengan data asli dari sumbermu) ===
const manhwaList = [
  { id: "solo-leveling-ash", title: "Solo Leveling: Ash", chapter: "Ch. 187" },
  { id: "tomb-raider-king", title: "Tomb Raider King", chapter: "Ch. 92" },
  { id: "nano-machine", title: "Nano Machine", chapter: "Ch. 154" },
  { id: "return-mount-hua", title: "Return of Mount Hua", chapter: "Ch. 118" },
  { id: "villain-to-kill", title: "Villain to Kill", chapter: "Ch. 61" },
  { id: "reincarnator", title: "Reincarnator", chapter: "Ch. 73" },
];

function renderUpdatesGrid() {
  const el = document.getElementById("grid-updates");
  el.innerHTML = manhwaList.map(m => `
    <div class="card" data-series-id="${m.id}" data-series-title="${m.title}">
      <div class="cover">
        <div class="cover-glyph">&#9673; &#9673;</div>
        <div class="badge">${m.chapter}</div>
      </div>
      <div class="card-body">
        <div class="card-title">${m.title}</div>
        <div class="card-meta"><span class="dot"></span>Manhwa</div>
      </div>
    </div>
  `).join("");
  attachCardEvents(el);
}

function attachCardEvents(container) {
  container.querySelectorAll(".card").forEach(card => {
    card.addEventListener("touchstart", () => card.classList.add("hovered"));
    card.addEventListener("touchend", () => setTimeout(() => card.classList.remove("hovered"), 250));
    card.addEventListener("click", () => {
      const { seriesId } = card.dataset;
      window.location.href = `read.html?series=${seriesId}&chapter=ch-187`;
    });
  });
}

// === BOTTOM NAV ===
function setupBottomNav() {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      // TODO: ganti tampilan sesuai tab yang diklik (home/search/settings)
      console.log("Tab aktif:", item.dataset.tab);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderUpdatesGrid();
  setupBottomNav();
});
