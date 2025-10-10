// script.js

/**
 * @param {Function} func
 * @param {number} delay
 * @returns {Function}
 */
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

fetch("https://beta.ourmanna.com/api/v1/get/?format=json&order=daily")
  .then((response) => response.json())
  .then((data) => {
    // console.log("Verse data: ", data);
    document.getElementById("verse-text").innerText = data.verse.details.text;
    document.getElementById("verse-ref").innerText =
      data.verse.details.reference;
  })
  .catch((error) => {
    console.error("Verse fetch error:", error);
    document.getElementById("verse-text").innerText = "Unable to load verse.";
  });

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "https://api.eternityready.com/";
  const PODCAST_API_URL =
    "https://keystone.eternityready.com/api/podcasts?limit=9999";

  let localData = { channels: [], movies: [], music: [], podcasts: [] };
  let normalizedData = { channels: [], movies: [], music: [], podcasts: [] };
  let apiCategories = [];

  let sliderObserver;
  let allPlaceholders = [];
  let lastObservedIndex = -1;
  const BATCH_SIZE = 5;

  async function loadAllDataSources() {
    const promises = [
      fetch(`${API_BASE_URL}api/categories`), // API
      fetch(PODCAST_API_URL), // Podcast
      fetch("/data/channels.json"), // Local
      fetch("/data/movies.json"), // Local
      fetch("/data/music.json"), // Local
    ];

    const results = await Promise.allSettled(promises);
    // console.log(results);
    if (results[1].status === "fulfilled") {
      const response = results[1].value;
      if (response.ok) {
        const podcastData = await response.json();
        localData.podcasts = podcastData.data || [];
        // console.log(`Podcasts loaded: ${localData.podcasts.length} episodes.`);
      } else {
        console.error("Failed fetching podcasts:", response.status);
      }
    } else {
      console.error("Network error fetching podcasts:", results[1].reason);
    }

    if (results[0].status === "fulfilled") {
      const response = results[0].value;
      if (response.ok) {
        apiCategories = (await response.json()) || [];
      } else {
        console.error("Failed fetching API categories: ", response.status);
      }
    } else {
      console.error(
        "Network error featching API categories: ",
        results[0].reason
      );
    }

    const localFiles = ["channels", "movies", "music"];
    for (let i = 0; i < localFiles.length; i++) {
      const result = results[i + 2];
      const fileName = localFiles[i];
      if (result.status === "fulfilled") {
        const response = result.value;
        if (response.ok) {
          const data = await response.json();
          localData[fileName] = data[fileName] || [];
        } else {
          console.error(
            `Failed loading /data/${fileName}.json:`,
            response.status
          );
        }
      } else {
        console.error(
          `Networking failed loading /data/${fileName}.json:`,
          result.reason
        );
      }
    }
    console.log(
      "Data font loaded.API Categories:",
      apiCategories.length,
      "Local items:",
      localData
    );
  }

  function normalizePodcastItem(item) {
    const id = item.slug || item.id;
    const categories = Array.isArray(item.podcastCategories)
      ? item.podcastCategories.map((cat) => ({ name: cat.name || cat }))
      : [];

    return {
      id: id,
      slug: item.slug,
      title: item.title,
      description: item.description || "",
      thumbnail: { url: item.imageUrl },
      categories: categories,
      author: item.author || "EternityReady",
      duration: item.duration || null,
      sourceType: "podcasts",
      videoId: null,
    };
  }

  async function fetchRecentVideos(limit = 20) {
    try {
      const response = await fetch(`${API_BASE_URL}api/search?limit=${limit}`);

      if (!response.ok) {
        console.error(`Failed fetchting recent API videos:`, response.status);
        return [];
      }
      const data = await response.json();
      const videos = data.videos || [];

      videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return videos;
    } catch (err) {
      console.error(`Network error fetching recent videos:`, err);
      return [];
    }
  }

  async function fetchFeaturedVideos() {
    try {
      const response = await fetch(`${API_BASE_URL}api/search?featured=true`);

      if (!response.ok) {
        console.error(`Failed fetching featured API videos:`, response.status);
        return [];
      }
      const data = await response.json();
      let featuredVideos = [];
      for (let i = 0; i < data.videos.length; i++) {
        if (data.videos[i].featured == true) {
          featuredVideos.push(data.videos[i]);
        }
      }
      return featuredVideos || [];
    } catch (err) {
      console.error(`Network error fetching featured videos:`, err);
      return [];
    }
  }

  function normalizeAllLocalData() {
    for (const key of Object.keys(localData)) {
      if (key === "podcasts") {
        normalizedData[key] = localData[key].map(normalizePodcastItem);
      } else {
        normalizedData[key] = localData[key].map((item) => {
          const normalizedItem = normalizeLocalItem(item);
          normalizedItem.sourceType = key; // Atribui o tipo de mídia (channels, movies, etc.)
          return normalizedItem;
        });
      }
    }

    localData = { channels: [], movies: [], music: [], podcasts: [] };
  }

  function normalizeLocalItem(item) {
    // Ajustado para usar `logo` como fallback para `thumbnail`
    let thumbnail = item.logo || item.thumbnail;
    if (thumbnail && !thumbnail.startsWith("http")) {
      thumbnail = new URL(thumbnail, API_BASE_URL).href;
    }

    // Normaliza o campo de categorias
    const categories = Array.isArray(item.categories)
      ? item.categories.map((name) =>
          typeof name === "string" ? { name } : name
        )
      : [];

    let videoId = null;
    if (item.embed) {
      let urlString = item.embed;
      if (urlString.trim().startsWith("<iframe")) {
        const match = urlString.match(/src=['"]([^'"]+)['"]/);
        urlString = match ? match[1] : null;
      }
      if (
        urlString &&
        urlString.includes("googleusercontent.com/youtube.com")
      ) {
        try {
          const potentialId = new URL(urlString).pathname.split("/").pop();
          if (potentialId) {
            videoId = potentialId.replace(/[^A-Za-z0-9_-]/g, "");
          }
        } catch (e) {
          console.warn(`Invalid embed URL: "${urlString}"`, e);
        }
      }
    }

    return {
      id: item.id || item.title || item.name,
      title: item.title || item.name,
      description: item.description || "",
      // Garante que thumbnail seja um objeto com a propriedade `url`
      thumbnail: { url: thumbnail },
      categories: categories,
      author: item.author || "EternityReady",
      duration: item.duration || null,
      videoId: videoId,
      // `sourceType` será adicionado na função `normalizeAllLocalData`
    };
  }

  async function fetchCategories() {
    return apiCategories;
  }

  async function fetchVideosByCategory(categoryName) {
    try {
      const response = await fetch(
        `${API_BASE_URL}api/search?category=${encodeURIComponent(categoryName)}`
      );
      if (!response.ok) {
        console.error(
          `Failed API fetch for category ${categoryName}:`,
          response.status
        );
        return [];
      }
      const data = await response.json();
      return data.videos || [];
    } catch (err) {
      console.error(`Network error for category ${categoryName}:`, err);
      return [];
    }
  }

  // ─── LÓGICA DO GRID DE CONTEÚDO LOCAL E FILTROS ──────────────────────────────
  function initializeLocalContentGrid() {
    const nameFilter = document.getElementById("name-filter");
    const mediaTypeFilter = document.getElementById("media-type-filter");
    const categoryFilter = document.getElementById("category-filter");
    const contentGrid = document.getElementById("content-grid");

    if (!nameFilter || !mediaTypeFilter || !categoryFilter || !contentGrid) {
      console.error("Elementos de filtro ou grid não encontrados.");
      return;
    }

    const allLocalData = [
      ...normalizedData.channels,
      ...normalizedData.movies,
      ...normalizedData.music,
      ...normalizedData.podcasts,
    ];

    function populateCategoryFilter() {
      const allCategories = allLocalData.flatMap((item) =>
        item.categories.map((cat) => cat.name)
      );
      const uniqueCategories = [...new Set(allCategories)].sort();

      uniqueCategories.forEach((categoryName) => {
        const option = document.createElement("option");
        option.value = categoryName;
        option.textContent = categoryName;
        categoryFilter.appendChild(option);
      });
    }

    function renderContentGrid() {
      const nameQuery = nameFilter.value.toLowerCase();
      const mediaTypeQuery = mediaTypeFilter.value;
      const categoryQuery = categoryFilter.value;

      const filteredData = allLocalData
        .filter((item) => {
          const nameMatch = item.title.toLowerCase().includes(nameQuery);
          const mediaTypeMatch =
            mediaTypeQuery === "all" || item.sourceType === mediaTypeQuery;
          const categoryMatch =
            categoryQuery === "all" ||
            item.categories.some((cat) => cat.name === categoryQuery);
          return nameMatch && mediaTypeMatch && categoryMatch;
        })
        .sort((a, b) => a.title.localeCompare(b.title));

      contentGrid.innerHTML = ""; // Limpa o grid

      if (filteredData.length === 0) {
        contentGrid.innerHTML =
          '<p class="loading-feedback">Nenhum resultado encontrado.</p>';
        return;
      }

      filteredData.forEach((item) => {
        let imageUrl = item.thumbnail.url || "images/placeholder.jpg";
        if (item.sourceType === "podcasts" && !imageUrl.startsWith("http")) {
          imageUrl = `https://keystone.eternityready.com${imageUrl}`;
        }

        const card = document.createElement("div");
        card.className = "media-card";
        card.innerHTML = `
            <div class="media-thumb">
                <img src="${imageUrl}" alt="${
          item.title
        }" loading="lazy" class="media-thumbnail"/>
                ${
                  item.duration
                    ? `<span class="media-duration">${item.duration}</span>`
                    : ""
                }
                <div class="media-type-label">${item.sourceType}</div>
            </div>
            <div class="media-info-col">
                <p class="media-title">${item.title}</p>
                <div class="media-subinfo">
                    <p class="media-genre">${item.categories
                      .map((c) => c.name)
                      .join(", ")}</p>
                    <p class="media-by">by <span class="media-author">${
                      item.author || "EternityReady"
                    }</span></p>
                </div>
            </div>
          `;
        contentGrid.appendChild(card);
      });
    }

    const debouncedRender = debounce(renderContentGrid, 300);
    nameFilter.addEventListener("input", debouncedRender);
    mediaTypeFilter.addEventListener("change", renderContentGrid);
    categoryFilter.addEventListener("change", renderContentGrid);

    populateCategoryFilter();
    renderContentGrid(); // Renderização inicial
  }

  // ─── CONTROLES DO PLAYER DE VÍDEO PRINCIPAL (HERO) ─────────────────────────────────
  function initializeHeroPlayer() {
    const heroVideo = document.querySelector(".hero-bg");
    if (!heroVideo) return;
    const playBtn = document.querySelector(".control-play");
    const progress = document.querySelector(".control-progress");
    const fsBtn = document.querySelector(".control-fullscreen");
    const likeBtn = document.querySelector(".btn-like");
    const settingsBtn = document.querySelector(".control-settings");
    const settingsMenu = document.getElementById("settings-menu");
    heroVideo.play().catch(() => {});
    if (playBtn) {
      const playIconPath = playBtn.querySelector("svg path");
      const PLAY_D = "M8 5v14l11-7z";
      const PAUSE_D = "M6 19h4V5H6v14zm8-14v14h4V5h-4z";
      playBtn.addEventListener("click", () => {
        if (heroVideo.paused) {
          heroVideo.play();
          playIconPath.setAttribute("d", PAUSE_D);
        } else {
          heroVideo.pause();
          playIconPath.setAttribute("d", PLAY_D);
        }
      });
    }
    if (progress) {
      heroVideo.addEventListener("timeupdate", () => {
        progress.value =
          (heroVideo.currentTime / heroVideo.duration) * 100 || 0;
      });
      progress.addEventListener("input", () => {
        heroVideo.currentTime = (progress.value / 100) * heroVideo.duration;
      });
    }
    const modal = document.getElementById("video-modal");
    if (fsBtn && modal) {
      const modalVideo = document.getElementById("modal-video");
      const modalClose = document.getElementById("video-modal-close");
      fsBtn.addEventListener("click", () => {
        modalVideo.src = heroVideo.currentSrc || heroVideo.src;
        modalVideo.currentTime = heroVideo.currentTime;
        modal.classList.add("video-modal-open");
        modalVideo.play();
      });
      const closeModal = () => {
        modal.classList.remove("video-modal-open");
        modalVideo.pause();
        heroVideo.currentTime = modalVideo.currentTime;
        if (!playBtn.querySelector("svg path[d*='M6']")) {
          heroVideo.play();
        }
      };
      modalClose.addEventListener("click", closeModal);
      document.addEventListener("keydown", (e) => {
        if (
          e.key === "Escape" &&
          modal.classList.contains("video-modal-open")
        ) {
          closeModal();
        }
      });
    }
    if (likeBtn) {
      likeBtn.addEventListener("click", () =>
        likeBtn.classList.toggle("liked")
      );
    }
    if (settingsBtn && settingsMenu) {
      settingsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        settingsMenu.style.display =
          settingsMenu.style.display === "flex" ? "none" : "flex";
      });
      document.addEventListener("click", (e) => {
        if (!settingsMenu.contains(e.target) && e.target !== settingsBtn) {
          settingsMenu.style.display = "none";
        }
      });
      settingsMenu.querySelectorAll(".setting-item").forEach((item) => {
        item.addEventListener("click", () => {
          if (item.dataset.speed) {
            heroVideo.playbackRate = parseFloat(item.dataset.speed);
          }
          if (item.classList.contains("toggle-mute")) {
            heroVideo.muted = !heroVideo.muted;
            item.textContent = heroVideo.muted ? "Unmute" : "Mute";
          }
        });
      });
    }
  }

  // ─── LÓGICA DA BARRA DE PESQUISA DINÂMICA ──────────────────────────────────────────
  async function initializeSearch() {
    const input = document.getElementById("search-input");
    const dropdown = document.getElementById("search-dropdown");
    if (!input || !dropdown) return;

    const historyList = document.getElementById("history-list"),
      noHistory = document.getElementById("no-history"),
      categoriesList = document.getElementById("categories-list"),
      categoriesSection = document.getElementById("categories-section"),
      historySection = document.getElementById("history-section"),
      mediaSection = document.getElementById("media-section"),
      mediaList = document.getElementById("media-list"),
      trendingList = document.getElementById("trending-list"),
      seeAllLink = document.getElementById("see-all");

    const trending = [
      "Countdown",
      "Smoke",
      "The Bear",
      "The Gilded Age",
      "The Amateur",
      "Squid Game",
    ];

    let history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    let availableCategories = await fetchCategories();

    async function searchMidia(query) {
      const lowerCaseQuery = query.toLowerCase();

      const apiSearchPromise = fetch(
        `${API_BASE_URL}api/search?search_query=${encodeURIComponent(query)}`
      )
        .then((res) => (res.ok ? res.json() : Promise.resolve({ videos: [] })))
        .then((data) => data.videos || [])
        .catch((err) => {
          console.error("Erro na busca da API:", err);
          return [];
        });

      const localSearchPromise = new Promise((resolve) => {
        const allLocalItems = [
          ...normalizedData.channels,
          ...normalizedData.movies,
          ...normalizedData.music,
          ...normalizedData.podcasts,
        ];
        const results = allLocalItems.filter(
          (item) =>
            item.title.toLowerCase().includes(lowerCaseQuery) ||
            item.description.toLowerCase().includes(lowerCaseQuery) ||
            item.categories.some((cat) =>
              cat.name.toLowerCase().includes(lowerCaseQuery)
            )
        );
        resolve(results);
      });

      const [apiResults, localResults] = await Promise.all([
        apiSearchPromise,
        localSearchPromise,
      ]);
      const apiResultIds = new Set(apiResults.map((v) => v.id));
      const uniqueLocalResults = localResults.filter(
        (v) => !apiResultIds.has(v.id)
      );
      return [...apiResults, ...uniqueLocalResults];
    }

    function renderTrending() {
      trendingList.innerHTML = "";
      trending.forEach((t) => {
        const btn = document.createElement("button");
        btn.className = "chip";
        btn.textContent = t;
        btn.onclick = () => {
          input.value = t;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        };
        trendingList.appendChild(btn);
      });
    }

    function renderCategories(categoriesData) {
      categoriesList.innerHTML = "";
      categoriesData.slice(0, 6).forEach((c) => {
        const btn = document.createElement("button");
        btn.className = "chip";
        btn.textContent = c.name;
        btn.onclick = () => {
          input.value = c.name;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        };
        categoriesList.appendChild(btn);
      });
    }

    function renderLiveResults(videos) {
      mediaSection.style.display = "block";
      categoriesSection.style.display = "none";
      historySection.style.display = "none";
      mediaList.innerHTML = "";
      if (videos.length === 0) {
        mediaList.innerHTML =
          '<li class="search-feedback">No results found.</li>';
        return;
      }
      videos.slice(0, 5).forEach((video) => {
        let imageUrl;

        let videoUrl;
        let targetAttribute = "";
        const id = encodeURIComponent(video.id);

        switch (video.sourceType) {
          case "music":
            imageUrl = video.thumbnail?.url;
            videoUrl = `/radio/?id=${id}`;
            break;
          case "channels":
          case "movies":
            imageUrl = video.thumbnail?.url;
            videoUrl = `/tv/?id=${id}`;
            break;
          case "podcasts":
            imageUrl = `https://keystone.eternityready.com${video.thumbnail.url}`;
            videoUrl = `https://podcasts.eternityready.com/episodes/${video.slug}`;
            targetAttribute = 'target="_blank" rel="noopener noreferrer"';
            break;
          default:
            videoUrl = `/player/?q=${id}`;
            imageUrl = `${API_BASE_URL}${video.thumbnail.url.replace(
              /^\//,
              ""
            )}`;
            break;
        }

        const mediaTypeLabel = video.sourceType
          ? video.sourceType.charAt(0).toUpperCase() + video.sourceType.slice(1)
          : "";

        const li = document.createElement("li");
        li.className = "media-item";
        li.innerHTML = `<a href="${videoUrl}" class="media-item-link ${targetAttribute}">
            <img src="${imageUrl}" loading="lazy" decoding="async" alt="${
          video.title
        }">
            <div class="media-info">
                <p class="media-title">${video.title}</p>
                <p class="media-meta">${(video.categories || [])
                  .map((c) => c.name)
                  .join(", ")}</p>
                ${
                  mediaTypeLabel
                    ? `<div class="media-type-label-dropdown">${mediaTypeLabel}</div>`
                    : ""
                }
            </div>
        </a>`;
        mediaList.appendChild(li);
      });
    }
    function renderEmpty() {
      mediaSection.style.display = "none";
      categoriesSection.style.display = "block";
      historySection.style.display = "block";
      noHistory.style.display = history.length ? "none" : "block";
      historyList.innerHTML = "";
      history.forEach((term) => {
        const li = document.createElement("li");
        li.className = "history-item";
        li.textContent = term;
        li.onclick = () => {
          input.value = term;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        };
        historyList.appendChild(li);
      });
      renderCategories(availableCategories);
      renderTrending();
      seeAllLink.textContent = "See all results »";
      seeAllLink.href = "/search";
    }
    const performLiveSearch = async (event) => {
      const query = event.target.value.trim();
      if (query) {
        seeAllLink.href = `/search/?query=${encodeURIComponent(query)}`;
        seeAllLink.textContent = `View all results for "${query}" »`;
      }
      if (query.length < 2) {
        renderEmpty();
        return;
      }
      mediaSection.style.display = "block";
      categoriesSection.style.display = "none";
      historySection.style.display = "none";
      mediaList.innerHTML = '<li class="search-feedback">Buscando...</li>';
      const results = await searchMidia(query);
      renderLiveResults(results);
    };
    const debouncedSearch = debounce(performLiveSearch, 400);
    input.addEventListener("input", debouncedSearch);
    input.addEventListener("focus", () => {
      dropdown.style.display = "block";
      if (input.value.trim() === "") {
        renderEmpty();
      } else {
        debouncedSearch({ target: { value: input.value } });
      }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const query = input.value.trim();
        if (query) {
          history = [query, ...history.filter((h) => h !== query)].slice(0, 5);
          localStorage.setItem("searchHistory", JSON.stringify(history));
          window.location.href = `/search/?query=${encodeURIComponent(query)}`;
        }
      }
    });
    document.addEventListener("click", (e) => {
      if (!document.querySelector(".search-container")?.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });
  }

  // ─── LÓGICA DOS SLIDERS (CARROSSÉIS) DINÂMICOS ──────────────────────────────────────────
  let sharedYTPlayer = null;
  let playerReady = false;
  let hoverTimeout;

  function createPlayer(elementId, videoId) {
    if (sharedYTPlayer && typeof sharedYTPlayer.destroy === "function") {
      sharedYTPlayer.destroy();
    }

    try {
      sharedYTPlayer = new YT.Player(elementId, {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          showinfo: 0,
          loop: 1,
          playlist: videoId,
          modestbranding: 1,
          iv_load_policy: 3,
          disablekb: 1,
        },
        events: {
          onReady: (event) => {
            event.target.unMute();
            event.target.playVideo();
          },
        },
      });
    } catch (e) {
      console.error(`Error creating YT Player for ${videoId}: ${e}`);
    }
  }

  window.onYouTubeIframeAPIReady = function () {
    playerReady = true;
  };

  function initializePlayerPreviews() {
    const slidersContainer = document.getElementById(
      "dynamic-sliders-container"
    );
    if (!slidersContainer) return;

    const stopAndDestroyPlayer = () => {
      if (sharedYTPlayer && typeof sharedYTPlayer.destroy === "function") {
        sharedYTPlayer.destroy();
        sharedYTPlayer = null;
      }
    };

    slidersContainer.addEventListener("mouseover", (event) => {
      if (!playerReady) return;

      const card = event.target.closest(".media-card[data-youtube-id]");
      if (card) {
        clearTimeout(hoverTimeout);

        const videoId = card.dataset.youtubeId;
        const playerContainer = card.querySelector(".youtube-player-embed");

        if (!videoId || !playerContainer) return;

        createPlayer(playerContainer.id, videoId);
      }
    });

    slidersContainer.addEventListener("mouseout", (event) => {
      const card = event.target.closest(".media-card[data-youtube-id]");
      if (card) {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(stopAndDestroyPlayer, 150);
      }
    });
  }

  /**
   * @param {HTMLElement} placeholder
   * @param {object} category
   */
  async function loadAndBuildSlider(placeholder, category) {
    const videos = await fetchVideosByCategory(category.name);

    if (videos.length < 3) {
      placeholder.remove();
      return false;
    }

    let playerInstanceCounter = document.querySelectorAll(
      ".youtube-player-embed"
    ).length;

    const sliderHTML = videos
      .map((video) => {
        const imageUrl = video.thumbnail?.url?.startsWith("http")
          ? video.thumbnail.url
          : video.thumbnail?.url
          ? `${API_BASE_URL}${video.thumbnail.url.replace(/^\//, "")}`
          : "images/placeholder.jpg";

        const playerUrl = `/player/?q=${video.id}`;
        const youtubeVideoId = video.videoId;
        const videoHoverData = youtubeVideoId
          ? `data-youtube-id="${youtubeVideoId}"`
          : "";
        let playerContainer = "";
        if (youtubeVideoId) {
          playerInstanceCounter++;
          const uniquePlayerId = `yt-player-instance-${playerInstanceCounter}`;
          playerContainer = `<div class="youtube-player-embed" id="${uniquePlayerId}"></div>`;
        }
        return `<a href="${playerUrl}" class="media-card-link"><div class="media-card" ${videoHoverData}><div class="media-thumb">${playerContainer} <img src="${imageUrl}" alt="${
          video.title
        }" loading="lazy" class="media-thumbnail" />${
          video.duration
            ? `<span class="media-duration">${video.duration}</span>`
            : ""
        }</div><div class="media-info-col"><p class="media-title">${
          video.title
        }</p><div class="media-subinfo"><p class="media-genre">${video.categories
          .map((c) => c.name)
          .join(", ")}</p><p class="media-by">by <span class="media-author">${
          video.author || "EternityReady"
        }</span></p></div></div></div></a>`;
      })
      .join("");

    const sliderContent = `<div class="section-header"><h2 class="section-title"><a href="/categories/?category=${encodeURIComponent(
      category.name
    )}">${
      category.name
    }</a></h2><a href="/categories?category=${encodeURIComponent(
      category.name
    )}" class="section-link"><i class="fa fa-chevron-right"></i></a></div><div class="slider-wrapper"><button class="slider-arrow prev" aria-label="Anterior"><i class="fa fa-chevron-left"></i></button><div class="media-grid">${sliderHTML}</div><button class="slider-arrow next" aria-label="Próximo"><i class="fa fa-chevron-right"></i></button></div><hr class="media-separator" />`;

    const sliderSection = document.createElement("div");
    sliderSection.className = `category-section ${category.name
      .toLowerCase()
      .replace(/[\s+&]/g, "-")}-section`;
    sliderSection.innerHTML = sliderContent;

    placeholder.replaceWith(sliderSection);
    initializeSliderControls(sliderSection);
    return true;
  }

  async function initializeDynamicSliders() {
    const slidersContainer = document.getElementById(
      "dynamic-sliders-container"
    );
    if (!slidersContainer) return;

    slidersContainer.innerHTML =
      '<p class="loading-feedback">Loading categories...</p>';

    const [featuredVideos, recentVideos, categories] = await Promise.all([
      fetchFeaturedVideos(),
      fetchRecentVideos(20),
      fetchCategories(),
    ]);

    slidersContainer.innerHTML = "";

    if (featuredVideos.length >= 3) {
      let playerInstanceCounter = document.querySelectorAll(
        ".youtube-player-embed"
      ).length;
      const sliderHTML = featuredVideos
        .map((video) => {
          const imageUrl = video.thumbnail?.url?.startsWith("http")
            ? video.thumbnail.url
            : video.thumbnail?.url
            ? `${API_BASE_URL}${video.thumbnail.url.replace(/^\//, "")}`
            : "images/placeholder.jpg";
          const playerUrl = `/player/?q=${video.id}`;
          const youtubeVideoId = video.videoId;
          const videoHoverData = youtubeVideoId
            ? `data-youtube-id="${youtubeVideoId}"`
            : "";
          let playerContainer = "";
          if (youtubeVideoId) {
            playerInstanceCounter++;
            const uniquePlayerId = `yt-player-featured-${playerInstanceCounter}`;
            playerContainer = `<div class="youtube-player-embed" id="${uniquePlayerId}"></div>`;
          }
          return `<a href="${playerUrl}" class="media-card-link"><div class="media-card" ${videoHoverData}><div class="media-thumb">${playerContainer} <img src="${imageUrl}" alt="${
            video.title
          }" loading="lazy" class="media-thumbnail" />${
            video.duration
              ? `<span class="media-duration">${video.duration}</span>`
              : ""
          }</div><div class="media-info-col"><p class="media-title">${
            video.title
          }</p><div class="media-subinfo"><p class="media-genre">${video.categories
            .map((c) => c.name)
            .join(", ")}</p><p class="media-by">by <span class="media-author">${
            video.author || "EternityReady"
          }</span></p></div></div></div></a>`;
        })
        .join("");

      const sliderContent = `<div class="section-header"><h2 class="section-title">Featured Videos</h2></div><div class="slider-wrapper"><button class="slider-arrow prev" aria-label="Anterior"><i class="fa fa-chevron-left"></i></button><div class="media-grid">${sliderHTML}</div><button class="slider-arrow next" aria-label="Próximo"><i class="fa fa-chevron-right"></i></button></div><hr class="media-separator" />`;

      const sliderSection = document.createElement("div");
      sliderSection.className = "category-section featured-videos-section";
      sliderSection.innerHTML = sliderContent;
      slidersContainer.appendChild(sliderSection);
      initializeSliderControls(sliderSection);
    }

    if (recentVideos.length >= 3) {
      let playerInstanceCounter = 0;
      const sliderHTML = recentVideos
        .map((video) => {
          const imageUrl = video.thumbnail?.url?.startsWith("http")
            ? video.thumbnail.url
            : video.thumbnail?.url
            ? `${API_BASE_URL}${video.thumbnail.url.replace(/^\//, "")}`
            : "images/placeholder.jpg";
          const playerUrl = `/player/?q=${video.id}`;
          const youtubeVideoId = video.videoId;
          const videoHoverData = youtubeVideoId
            ? `data-youtube-id="${youtubeVideoId}"`
            : "";
          let playerContainer = "";
          if (youtubeVideoId) {
            playerInstanceCounter++;
            const uniquePlayerId = `yt-player-recent-${playerInstanceCounter}`;
            playerContainer = `<div class="youtube-player-embed" id="${uniquePlayerId}"></div>`;
          }
          return `<a href="${playerUrl}" class="media-card-link"><div class="media-card" ${videoHoverData}><div class="media-thumb">${playerContainer} <img src="${imageUrl}" alt="${
            video.title
          }" loading="lazy" class="media-thumbnail" />${
            video.duration
              ? `<span class="media-duration">${video.duration}</span>`
              : ""
          }</div><div class="media-info-col"><p class="media-title">${
            video.title
          }</p><div class="media-subinfo"><p class="media-genre">${video.categories
            .map((c) => c.name)
            .join(", ")}</p><p class="media-by">by <span class="media-author">${
            video.author || "EternityReady"
          }</span></p></div></div></div></a>`;
        })
        .join("");

      const sliderContent = `<div class="section-header"><h2 class="section-title">Newest Stuff</h2></div><div class="slider-wrapper"><button class="slider-arrow prev" aria-label="Anterior"><i class="fa fa-chevron-left"></i></button><div class="media-grid">${sliderHTML}</div><button class="slider-arrow next" aria-label="Próximo"><i class="fa fa-chevron-right"></i></button></div><hr class="media-separator" />`;

      const sliderSection = document.createElement("div");
      sliderSection.className = "category-section recent-videos-section";
      sliderSection.innerHTML = sliderContent;
      slidersContainer.appendChild(sliderSection); // Adiciona o novo slider ao container
      initializeSliderControls(sliderSection); // Inicializa as setas e o arraste
    }

    if (categories.length === 0 && recentVideos.length < 3) {
      slidersContainer.innerHTML =
        '<p class="loading-feedback">No category found.</p>';
      return;
    }

    categories.forEach((category) => {
      const placeholder = document.createElement("div");
      placeholder.className = "slider-placeholder";
      placeholder.dataset.categoryName = category.name;
      // Adiciona um feedback visual de carregamento
      placeholder.innerHTML = `<div class="loading-spinner"></div>`;
      slidersContainer.appendChild(placeholder);
    });

    allPlaceholders = Array.from(
      document.querySelectorAll(".slider-placeholder")
    );

    sliderObserver = new IntersectionObserver(
      async (entries, observer) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const placeholder = entry.target;
            const categoryName = placeholder.dataset.categoryName;

            observer.unobserve(placeholder);

            const success = await loadAndBuildSlider(placeholder, {
              name: categoryName,
            });
            if (success) {
              const nextPlaceholderToObserve =
                allPlaceholders[lastObservedIndex + 1];
              if (nextPlaceholderToObserve) {
                nextPlaceholderToObserve.classList.add("is-observable");
                sliderObserver.observe(nextPlaceholderToObserve);
                lastObservedIndex++;
              }
            }
          }
        }
      },
      {
        rootMargin: "200px 0px",
        threshold: 0.01,
      }
    );

    for (let i = 0; i < BATCH_SIZE; i++) {
      const placeholder = allPlaceholders[i];
      if (placeholder) {
        placeholder.classList.add("is-observable");
        sliderObserver.observe(placeholder);
        lastObservedIndex = i;
      } else {
        break;
      }
    }
  }

  // ─── INICIALIZAÇÃO DOS COMPONENTES DE UI E FUNÇÃO PRINCIPAL ─────────
  /**
   * @param {HTMLElement} context
   */
  function initializeSliderControls(context = document) {
    context.querySelectorAll(".slider-wrapper").forEach((wrapper) => {
      const slider = wrapper.querySelector(".media-grid");
      const prevBtn = wrapper.querySelector(".slider-arrow.prev");
      const nextBtn = wrapper.querySelector(".slider-arrow.next");
      if (!slider || !prevBtn || !nextBtn) return;

      const itemCount = slider.querySelectorAll(".media-card-link").length;

      if (itemCount > 5) {
        const scrollAmount = slider.clientWidth * 0.8;
        prevBtn.addEventListener("click", () =>
          slider.scrollBy({ left: -scrollAmount, behavior: "smooth" })
        );
        nextBtn.addEventListener("click", () =>
          slider.scrollBy({ left: scrollAmount, behavior: "smooth" })
        );
      } else {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
      }
    });
    context.querySelectorAll(".media-grid").forEach((slider) => {
      let isDown = false,
        startX,
        scrollLeft;
      const startDrag = (e) => {
        isDown = true;
        slider.classList.add("dragging");
        startX = (e.pageX || e.touches[0].pageX) - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      };
      const moveDrag = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = (e.pageX || e.touches[0].pageX) - slider.offsetLeft;
        const walk = (x - startX) * 1.5;
        slider.scrollLeft = scrollLeft - walk;
      };
      const endDrag = () => {
        isDown = false;
        slider.classList.remove("dragging");
      };
      slider.addEventListener("mousedown", startDrag);
      slider.addEventListener("mousemove", moveDrag);
      slider.addEventListener("mouseup", endDrag);
      slider.addEventListener("mouseleave", endDrag);
      slider.addEventListener("touchstart", startDrag, { passive: true });
      slider.addEventListener("touchmove", moveDrag, { passive: false });
      slider.addEventListener("touchend", endDrag);
    });
  }

  function initializeGeneralUI() {
    const menuBtn = document.querySelector(".btn-menu"),
      overlay = document.querySelector(".menu-overlay"),
      mobileNav = document.querySelector(".mobile-nav"),
      closeBtn = document.querySelector(".btn-nav-close");
    if (menuBtn && overlay && mobileNav && closeBtn) {
      const toggleMobileNav = () => {
        mobileNav.classList.toggle("open");
        overlay.classList.toggle("open");
      };
      menuBtn.addEventListener("click", toggleMobileNav);
      closeBtn.addEventListener("click", toggleMobileNav);
      overlay.addEventListener("click", toggleMobileNav);
    }
    document.querySelectorAll(".mobile-nav .nav-group > a").forEach((link) => {
      if (!link.nextElementSibling?.classList.contains("submenu")) return;
      link.addEventListener("click", (e) => {
        e.preventDefault();
        link.classList.toggle("open");
      });
    });
  }

  // =======================================================================
  // --- HERO SECTION DYNAMIC LOGIC ---
  // =======================================================================

  const heroSliderContainer = document.getElementById("hero-slider-container");
  let heroYTPlayer = null;

  /**
   * @returns {Promise<Array>}
   */
  async function fetchHeroVideos() {
    const endpoint = `${API_BASE_URL}api/highlight`;
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      const data = await response.json();
      const randomIndex = Math.floor(Math.random() * data.videos.length);
      return data.videos[randomIndex] || [];
    } catch (error) {
      console.error("Failed to fetch videos for hero section:", error);
      heroSliderContainer.innerHTML = `<p class="container" style="text-align: center; color: red;">Unable to load highlights.</p>`;
      return [];
    }
  }

  /**
   * @param {object} video - O objeto de vídeo da API.
   * @returns {string} - O HTML do slide.
   */
  function createHeroSlideHTML(video) {
    // const logoUrl = video.logoUrl || "images/My-Fault.png";

    const youtubeVideoId = video.videoId;
    const title = video.title || "Title Unavailable";
    const description = video.description || "Description Unavailable.";
    const rating = video.rating || "6.3";
    const genres = (video.categories || ["Action", "Adventure"])
      .map((category) => category.name || category)
      .join('</span><span class="genre">');
    // const thumbnail = `${API_BASE_URL}${video.thumbnail.url}`;
    const thumbnail = new URL(video.thumbnail.url, API_BASE_URL);

    return `
      <section class="hero-section">
        <div class="container">
          <div class="hero-card">
            
            <iframe
              class="hero-bg"
              src="https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${youtubeVideoId}&controls=0&showinfo=0&rel=0"
              frameborder="0"
              allow="autoplay; encrypted-media"
              allowfullscreen
            ></iframe>

            <div class="hero-gradient"></div>
            <div class="hero-content">
              <div class="hero-logo-img">
                <img src="${thumbnail}" alt="${title}" />
              </div>
              <div class="hero-langs">
                <a href="#">English</a> |  <a href="#">Hindi</a> | 
                <a href="#">Tamil</a> |  <a href="#">Telugu</a> | 
                <a href="#">Malayalam</a> |  <a href="#">Kannada</a>
              </div>
              <p class="hero-tagline">NEW ORIGINAL MOVIE</p>
              <div class="hero-stats">
                <span class="trending">#Trending Now</span>
                <span class="rating">★ ${rating}</span>
              </div>
              <div class="hero-genres">
                <span class="genre">
                  ${genres}
                </span>
              </div>
              <p class="hero-desc">
                ${description}
              </p>
              <div class="hero-cta">
                <button class="btn-play" aria-label="Watch Now" onClick="window.location.href = '/player/?q=${video.id}'">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z"></path>
                  </svg>
                  Watch Now
                </button>
                <button class="btn-icon" aria-label="Bookmark">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M6 4h12v18l-6-5-6 5z"></path>
                  </svg>
                </button>
                <button class="btn-icon" aria-label="More info">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 6h.01m-1 4h2v6h-2z"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="hero-media-wrap">
              <video
                class="hero-preview"
                src="path/to/your/outofthisworld.mov"
                muted
                loop
                playsinline
              ></video>
              <div class="video-info">
                <div class="info-bubble">
                  <img
                    src="images/toppng.com-donna-picarro-dummy-avatar-768x768.png"
                    alt=""
                    class="info-avatar"
                  />
                  <span>outofthisworld.mov</span>
                </div>
                <div class="info-bubble info-from">
                  <span>from Studio Mars</span>
                </div>
              </div>
              <div class="aside-icons">
                <button class="btn-like" aria-label="Like">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M12 21l-1-1C5 15 2 12 2 8a5 5 0 0 1 10 0
                    5 5 0 0 1 10 0c0 4-3 7-9 12l-1 1z"
                    />
                  </svg>
                </button>
                <button aria-label="Watch later">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                </button>
                <button aria-label="Go back">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M20 11H7.83l5.58-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
                    ></path>
                  </svg>
                </button>
              </div>
              <div class="hero-controls">
                <button class="control-play" aria-label="Play/Pause">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z"></path>
                  </svg>
                </button>
                <input
                  type="range"
                  class="control-progress"
                  min="0"
                  max="100"
                  value="0"
                  aria-label="Video progress"
                />
                <div class="control-actions">
                  <button class="control-settings" aria-label="Settings">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm7.43 4a7.43 7.43 0 0 0-.13-1l2.11-1.65-2-3.46-2.49 1a7.36 7.36 0 0 0-1.7-.99l-.38-2.65h-4l-.38 2.65a7.36 7.36 0 0 0-1.7.99l-2.49-1-2 3.46 2.11 1.65c-.05.33-.08.66-.08 1s.03.67.08 1L2.52 15.65l2 3.46 2.49-1c.5.4 1.05.73 1.7.99l.38 2.65h4l.38-2.65c.65-.26 1.2-.59 1.7-.99l2.49 1 2-3.46-2.11-1.65c.1-.33.13-.66.13-1z"
                      />
                    </svg>
                  </button>
                  <button
                    class="control-fullscreen"
                    aria-label="Toggle Fullscreen"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M7 14H5v5h5v-2H7v-3zm0-4h2V7h3V5H7v5zm10 4h2v3h-3v2h5v-5zm-2-4V5h-5v2h3v3h2z"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div id="settings-menu" class="settings-menu">
                <ul>
                  <li class="setting-item" data-speed="0.5">0.5× Speed</li>
                  <li class="setting-item" data-speed="1">1× Speed</li>
                  <li class="setting-item" data-speed="1.5">1.5× Speed</li>
                  <li class="setting-item" data-speed="2">2× Speed</li>
                  <li class="setting-item toggle-mute">Mute</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section> 
    `;
  }

  function initializeHeroPlayer() {
    const activeHeroSlide = document.querySelector(".hero-slide.active");
    if (!activeHeroSlide) return;

    const playerContainer = activeHeroSlide.querySelector(".hero-bg-youtube");
    if (!playerContainer) {
      // Se não for um vídeo do YouTube, procuramos o vídeo HTML normal
      const heroVideo = activeHeroSlide.querySelector(".hero-bg");
      if (heroVideo) {
        heroVideo.play().catch(() => {});
        // Adicionar a lógica para os botões de controle do vídeo HTML aqui
        // (Play/Pause, Fullscreen, etc.) se houver.
        // O restante da sua lógica original de `initializeHeroPlayer` para <video> pode ir aqui.
        const playBtn = activeHeroSlide.querySelector(".control-play"); // Assegure-se de que o seletor está correto para o slide ativo
        const progress = activeHeroSlide.querySelector(".control-progress");
        const fsBtn = activeHeroSlide.querySelector(".control-fullscreen");

        if (playBtn) {
          const playIconPath = playBtn.querySelector("svg path");
          const PLAY_D = "M8 5v14l11-7z";
          const PAUSE_D = "M6 19h4V5H6v14zm8-14v14h4V5h-4z";
          playBtn.addEventListener("click", () => {
            if (heroVideo.paused) {
              heroVideo.play();
              playIconPath.setAttribute("d", PAUSE_D);
            } else {
              heroVideo.pause();
              playIconPath.setAttribute("d", PLAY_D);
            }
          });
        }
        if (progress) {
          heroVideo.addEventListener("timeupdate", () => {
            progress.value =
              (heroVideo.currentTime / heroVideo.duration) * 100 || 0;
          });
          progress.addEventListener("input", () => {
            heroVideo.currentTime = (progress.value / 100) * heroVideo.duration;
          });
        }
        // Lógica para o botão de fullscreen, etc.
        const modal = document.getElementById("video-modal");
        if (fsBtn && modal) {
          const modalVideo = document.getElementById("modal-video");
          const modalClose = document.getElementById("video-modal-close");
          fsBtn.addEventListener("click", () => {
            modalVideo.src = heroVideo.currentSrc || heroVideo.src;
            modalVideo.currentTime = heroVideo.currentTime;
            modal.classList.add("video-modal-open");
            modalVideo.play();
          });
          const closeModal = () => {
            modal.classList.remove("video-modal-open");
            modalVideo.pause();
            heroVideo.currentTime = modalVideo.currentTime;
            // Ajustar o estado do botão de play se necessário
            if (playBtn) {
              const playIconPath = playBtn.querySelector("svg path");
              if (!heroVideo.paused) {
                playIconPath.setAttribute("d", PAUSE_D);
              } else {
                playIconPath.setAttribute("d", PLAY_D);
              }
            }
          };
          modalClose.addEventListener("click", closeModal);
          document.addEventListener("keydown", (e) => {
            if (
              e.key === "Escape" &&
              modal.classList.contains("video-modal-open")
            ) {
              closeModal();
            }
          });
        }
      }
      return; // Nada a fazer se não for um player do YouTube e não houver vídeo HTML
    }

    const videoId = playerContainer.id.replace("hero-youtube-player-", "");

    // Destruir o player existente se houver um
    if (heroYTPlayer && typeof heroYTPlayer.destroy === "function") {
      heroYTPlayer.destroy();
      heroYTPlayer = null;
    }

    // Criar um novo player do YouTube
    heroYTPlayer = new YT.Player(playerContainer.id, {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        rel: 0,
        showinfo: 0,
        loop: 1,
        playlist: videoId,
        modestbranding: 1,
        iv_load_policy: 3,
        disablekb: 1,
        mute: 1,
      },
      events: {
        onReady: (event) => {
          event.target.playVideo();
          event.target.mute();
        },
        onStateChange: (event) => {
          if (event.data === YT.PlayerState.PLAYING) {
          } else {
            // Atualizar o ícone do botão de play para play
          }
        },
      },
    });

    // Lógica para os botões de controle do Hero Player (play/pause, fullscreen, etc.)
    const playBtn = activeHeroSlide.querySelector(".btn-play");
    const likeBtn = activeHeroSlide.querySelector(".btn-like");
    const settingsBtn = activeHeroSlide.querySelector(".control-settings");
    const settingsMenu = document.getElementById("settings-menu"); // Talvez precise ser específico para o slide ativo

    if (playBtn) {
      const playIconPath = playBtn.querySelector("svg path");
      const PLAY_D = "M8 5v14l11-7z";
      const PAUSE_D = "M6 19h4V5H6v14zm8-14v14h4V5h-4z";

      playBtn.addEventListener("click", () => {
        if (heroYTPlayer) {
          if (
            heroYTPlayer.getPlayerState() === YT.PlayerState.PAUSED ||
            heroYTPlayer.getPlayerState() === YT.PlayerState.ENDED
          ) {
            heroYTPlayer.playVideo();
            playIconPath.setAttribute("d", PAUSE_D);
          } else {
            heroYTPlayer.pauseVideo();
            playIconPath.setAttribute("d", PLAY_D);
          }
        }
      });
    }
    if (likeBtn) {
      likeBtn.addEventListener("click", () =>
        likeBtn.classList.toggle("liked")
      );
    }
    if (settingsBtn && settingsMenu) {
      settingsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        settingsMenu.style.display =
          settingsMenu.style.display === "flex" ? "none" : "flex";
      });
      document.addEventListener("click", (e) => {
        if (!settingsMenu.contains(e.target) && e.target !== settingsBtn) {
          settingsMenu.style.display = "none";
        }
      });
      settingsMenu.querySelectorAll(".setting-item").forEach((item) => {
        item.addEventListener("click", () => {
          if (item.dataset.speed && heroYTPlayer) {
            heroYTPlayer.setPlaybackRate(parseFloat(item.dataset.speed));
          }
          if (item.classList.contains("toggle-mute") && heroYTPlayer) {
            if (heroYTPlayer.isMuted()) {
              heroYTPlayer.unMute();
              item.textContent = "Mute";
            } else {
              heroYTPlayer.mute();
              item.textContent = "Unmute";
            }
          }
        });
      });
    }
  }

  function initializeHeroSlider() {
    const slides = document.querySelectorAll(".hero-slide");
    const prevBtn = document.querySelector(".slider-nav.prev");
    const nextBtn = document.querySelector(".slider-nav.next");
    let currentIndex = 0;
    let slideInterval;

    if (slides.length <= 1) {
      if (prevBtn) prevBtn.style.display = "none";
      if (nextBtn) nextBtn.style.display = "none";
      // Se houver apenas um slide, inicializa seu player
      if (slides.length === 1) {
        slides[0].classList.add("active");
        if (playerReady) {
          // Garante que a API do YouTube esteja pronta
          initializeHeroPlayer();
        } else {
          window.onYouTubeIframeAPIReady = () => {
            playerReady = true;
            initializeHeroPlayer();
          };
        }
      }
      return;
    }

    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.classList.toggle("active", i === index);
      });
      if (playerReady) {
        // Re-inicializa o player do YouTube para o novo slide ativo
        initializeHeroPlayer();
      }
    }

    function nextSlide() {
      currentIndex = (currentIndex + 1) % slides.length;
      showSlide(currentIndex);
      startAutoplay(); // Reinicia o autoplay para cada troca manual
    }

    function prevSlide() {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      showSlide(currentIndex);
      startAutoplay(); // Reinicia o autoplay para cada troca manual
    }

    function startAutoplay() {
      stopAutoplay();
      slideInterval = setInterval(nextSlide, 15 * 1000);
    }

    function stopAutoplay() {
      clearInterval(slideInterval);
    }

    nextBtn.addEventListener("click", () => {
      nextSlide();
    });

    prevBtn.addEventListener("click", () => {
      prevSlide();
    });

    showSlide(currentIndex);
    startAutoplay();
  }

  async function loadHeroSection() {
    if (!heroSliderContainer) return;

    const videos = await fetchHeroVideos();

    if (videos != null) {
      heroSliderContainer.innerHTML = createHeroSlideHTML(videos);
      heroSliderContainer.firstElementChild.classList.add("active");
      initializeHeroSlider();
    } else {
      heroSliderContainer.innerHTML = `
          <div class="hero-slide active">
            <div class="hero-card">
                <div class="hero-content" style="text-align:center;">
                    <h2 style="color: white;">No highlights available at this time.</h2>
                </div>
            </div>
          </div>
        `;
    }
  }

  loadHeroSection();

  async function main() {
    await loadAllDataSources();
    normalizeAllLocalData();

    initializeHeroPlayer();
    initializeSearch();
    initializeLocalContentGrid();
    initializeDynamicSliders();
    initializeGeneralUI();
    initializePlayerPreviews();
  }

  main();
});
