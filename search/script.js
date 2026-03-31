// search/script.js
// Uses shared functions from /lib/normalize.js: normalizeLocalItem, normalizeRadioItem,
// normalizePodcastItem, renderCategoryTags, createVideoCard, debounce

document.addEventListener("DOMContentLoaded", async () => {
  const PODCAST_API_URL = "https://keystone.eternityready.com/api/podcasts?limit=9999";
  const dynamicContentArea = document.getElementById("dynamic-content-area");

  // ── DATA LOADING ──────────────────────────────────────────────────────────

  async function loadAllNormalizedData() {
    const promises = [
      fetch("/data/channels.json"),
      fetch("/data/movies.json"),
      fetch("/data/music.json"),
      fetch("/data/radio.json"),
      fetch(PODCAST_API_URL).catch(() => ({ ok: false })),
    ];
    const results = await Promise.allSettled(promises);
    const allItems = [];

    const fileKeys = ["channels", "movies", "music", "radio"];
    for (let i = 0; i < 4; i++) {
      const result = results[i];
      const key = fileKeys[i];
      if (result.status !== "fulfilled" || !result.value.ok) {
        console.error(`Failed to load /data/${key}.json`);
        continue;
      }
      try {
        const data = await result.value.json();
        const items = (key === "radio" ? data.channels : data[key]) || [];
        if (key === "radio") {
          items.forEach((item) => allItems.push(normalizeRadioItem(item)));
        } else {
          items.forEach((item) =>
            allItems.push({ ...normalizeLocalItem(item), sourceType: key })
          );
        }
      } catch (e) {
        console.error(`Failed to parse /data/${key}.json`, e);
      }
    }

    if (results[4].status === "fulfilled" && results[4].value.ok) {
      try {
        const podcastJson = await results[4].value.json();
        (podcastJson.data || []).forEach((item) =>
          allItems.push(normalizePodcastItem(item))
        );
      } catch (e) {
        console.error("Failed to parse podcast data", e);
      }
    }

    return allItems;
  }

  // ── SEARCH ────────────────────────────────────────────────────────────────

  async function searchMedia(query) {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();

    const [allLocalItems, apiResults] = await Promise.all([
      loadAllNormalizedData(),
      fetch(
        `${API_BASE_URL}/api/search?search_query=${encodeURIComponent(query)}`
      )
        .then((res) => (res.ok ? res.json() : { videos: [] }))
        .then((data) => data.videos || [])
        .catch(() => []),
    ]);

    const localResults = allLocalItems.filter(
      (item) =>
        (item.title || "").toLowerCase().includes(lowerQuery) ||
        (item.description || "").toLowerCase().includes(lowerQuery) ||
        (item.categories || []).some((cat) =>
          (cat.name || "").toLowerCase().includes(lowerQuery)
        )
    );

    const apiIds = new Set(apiResults.map((v) => v.id));
    const uniqueLocal = localResults.filter((v) => !apiIds.has(v.id));
    return [...apiResults, ...uniqueLocal];
  }

  // ── RENDER ────────────────────────────────────────────────────────────────

  async function fetchAndRenderSearchResults() {
    if (!dynamicContentArea) return;

    const params = new URLSearchParams(window.location.search);
    const query = params.get("query") || "";
    const backBtn = '<a class="backHome-Button" href="/">Back Home</a>';

    if (!query) {
      dynamicContentArea.innerHTML =
        backBtn +
        '<p style="text-align:center;">Please enter a search term.</p>';
      return;
    }

    dynamicContentArea.innerHTML =
      backBtn + '<p style="text-align:center;">Searching...</p>';

    try {
      const results = await searchMedia(query);
      if (results.length > 0) {
        const cardsHTML = results.map((v) => window.createVideoCard(v)).join("");
        dynamicContentArea.innerHTML = `${backBtn}
          <section class="media-section">
            <div class="all-videos-section">
              <div class="section-header">
                <h2 class="section-title">Search results for "${query}"</h2>
              </div>
              <div class="media-grid all-videos-grid">${cardsHTML}</div>
            </div>
          </section>`;
      } else {
        dynamicContentArea.innerHTML =
          backBtn +
          `<p style="text-align:center;">No results found for "${query}".</p>`;
      }
    } catch (err) {
      console.error("Search error:", err);
      dynamicContentArea.innerHTML =
        backBtn +
        '<p style="text-align:center;color:red;">Could not load results.</p>';
    }
  }

  fetchAndRenderSearchResults();
});
