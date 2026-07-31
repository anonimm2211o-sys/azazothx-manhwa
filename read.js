// === DATA CHAPTER (contoh — ganti dengan data & gambar asli dari sumbermu) ===
// Struktur: setiap manhwa punya daftar chapter, dan tiap chapter punya daftar halaman (URL gambar)
const chapterData = {
  "solo-leveling-ash": {
    title: "Solo Leveling: Ash",
    chapters: [
      { id: "ch-186", label: "Chapter 186", pages: [] },
      { id: "ch-187", label: "Chapter 187", pages: [] }, // pages diisi array URL gambar
      { id: "ch-188", label: "Chapter 188", pages: [] },
    ],
  },
  // tambahkan manhwa lain di sini dengan struktur yang sama
};

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    series: params.get("series"),
    chapter: params.get("chapter"),
  };
}

function renderReader() {
  const { series, chapter } = getParams();
  const seriesData = chapterData[series];

  if (!seriesData) {
    document.getElementById("reader-title").textContent = "Manhwa tidak ditemukan";
    return;
  }

  const chapterIndex = seriesData.chapters.findIndex(c => c.id === chapter);
  const currentChapter = seriesData.chapters[chapterIndex] || seriesData.chapters[0];
  const actualIndex = chapterIndex === -1 ? 0 : chapterIndex;

  // Update judul header
  document.getElementById("reader-title").innerHTML = `
    ${seriesData.title}
    <small>${currentChapter.label}</small>
  `;

  // Render halaman-halaman
  const pagesEl = document.getElementById("reader-pages");
  if (currentChapter.pages && currentChapter.pages.length > 0) {
    pagesEl.innerHTML = currentChapter.pages
      .map((url, i) => `<img src="${url}" alt="Halaman ${i + 1}" loading="lazy">`)
      .join("");
  } else {
    // Placeholder kalau belum ada gambar asli
    pagesEl.innerHTML = Array.from({ length: 5 })
      .map((_, i) => `
        <div class="page-placeholder">
          <div class="glyph">&#9673;</div>
          <span>Halaman ${i + 1} — belum ada gambar</span>
        </div>
      `).join("");
  }

  // Setup tombol prev/next
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  const prevChapter = seriesData.chapters[actualIndex - 1];
  const nextChapter = seriesData.chapters[actualIndex + 1];

  if (prevChapter) {
    prevBtn.disabled = false;
    prevBtn.onclick = () => {
      window.location.href = `read.html?series=${series}&chapter=${prevChapter.id}`;
    };
  } else {
    prevBtn.disabled = true;
  }

  if (nextChapter) {
    nextBtn.disabled = false;
    nextBtn.onclick = () => {
      window.location.href = `read.html?series=${series}&chapter=${nextChapter.id}`;
    };
  } else {
    nextBtn.disabled = true;
    nextBtn.textContent = "Chapter Terakhir";
  }

  // Scroll ke atas tiap ganti chapter
  window.scrollTo(0, 0);
}

document.addEventListener("DOMContentLoaded", renderReader);
