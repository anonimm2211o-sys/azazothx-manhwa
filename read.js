const API_BASE = "https://shinei-api.vercel.app/api/v1";

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    series: params.get("series"),
    chapter: params.get("chapter"),
  };
}

async function fetchSeriesWithChapters(slug) {
  try {
    const res = await fetch(`${API_BASE}/series/${slug}?include=chapters`);
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    console.error("Gagal ambil data series:", err);
    return null;
  }
}

async function renderReader() {
  const { series, chapter } = getParams();

  if (!series) {
    document.getElementById("reader-title").textContent = "Manhwa tidak ditemukan";
    return;
  }

  const seriesData = await fetchSeriesWithChapters(series);

  if (!seriesData) {
    document.getElementById("reader-title").textContent = "Gagal memuat data";
    return;
  }

  const chapters = seriesData.chapters || [];
  const chapterIndex = chapters.findIndex(c => c.id === chapter);
  const currentChapter = chapters[chapterIndex] || chapters[0];
  const actualIndex = chapterIndex === -1 ? 0 : chapterIndex;

  document.getElementById("reader-title").innerHTML = `
    ${seriesData.title}
    <small>${currentChapter ? currentChapter.title : 'Chapter tidak ditemukan'}</small>
  `;

  const pagesEl = document.getElementById("reader-pages");
  if (currentChapter && currentChapter.sources && currentChapter.sources.length > 0) {
    pagesEl.innerHTML = `
      <div class="page-placeholder" style="aspect-ratio:auto; padding:40px 20px;">
        <div class="glyph">&#9673;</div>
        <span style="text-align:center; line-height:1.6;">
          Chapter ini tersedia di sumber resmi.<br>
          Silakan buka link di bawah untuk membaca.
        </span>
        <a href="${currentChapter.sources[0].url}" target="_blank" rel="noopener"
           style="margin-top:14px; padding:10px 20px; background:rgba(124,58,237,0.2); border:1px solid var(--violet); border-radius:999px; color:var(--lilac); text-decoration:none; font-size:0.8rem; font-weight:600;">
          Baca di ${currentChapter.sources[0].name}
        </a>
      </div>
    `;
  } else {
    pagesEl.innerHTML = `
      <div class="page-placeholder">
        <div class="glyph">&#9673;</div>
        <span>Sumber chapter tidak tersedia</span>
      </div>
    `;
  }

  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const prevChapter = chapters[actualIndex - 1];
  const nextChapter = chapters[actualIndex + 1];

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

  window.scrollTo(0, 0);
}

document.addEventListener("DOMContentLoaded", renderReader);
