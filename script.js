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
    console.log("Verse data: ", data);
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
        console.log(`Podcasts loaded: ${localData.podcasts.length} episodes.`);
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
      "Data font loaded. API Categories:",
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
      for (i = 0; i < data.videos.length; i++) {
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
          normalizedItem.sourceType = key;
          return normalizedItem;
        });
      }
    }

    localData = { channels: [], movies: [], music: [], podcasts: [] };
  }

  function normalizeLocalItem(item) {
    let thumbnail = item.logo || item.thumbnail;
    if (thumbnail && !thumbnail.startsWith("http")) {
      thumbnail = new URL(thumbnail, API_BASE_URL).href;
    }

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
      thumbnail: { url: thumbnail },
      categories: categories,
      author: item.author || "EternityReady",
      duration: item.duration || null,
      videoId: videoId,
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
      return data.videos || [];
    } catch (error) {
      console.error("Failed to fetch videos for hero section:", error);
      heroSliderContainer.innerHTML = `<p class="container" style="text-align: center; color: red;">Não foi possível carregar os destaques.</p>`;
      return [];
    }
  }

  /**
   * @param {object} video - O objeto de vídeo da API.
   * @returns {string} - O HTML do slide.
   */
  function createHeroSlideHTML(video) {
    const logoUrl = video.logoUrl || "images/My-Fault.png";
    const videoUrl = video.id
      ? `https://www.youtube.com/watch?v=${video.id}`
      : "videos/placeholder.mp4";
    const title = video.title || "Title Unavailable";
    const description = video.description || "Description Unavailable.";
    const rating = video.rating || "N/A";
    const genres = (video.categories || ["Action", "Adventure"])
      .map((category) => category.name || category)
      .join('</span><span class="genre">');

    // console.log(video);

    return `
      <div class="hero-slide">
        <div class="hero-card">
          <video class="hero-bg" src="${videoUrl}" autoplay muted loop playsinline></video>
          <div class="hero-gradient"></div>
          <div class="hero-content">
            <div class="hero-logo-img">
              <img src="${logoUrl}" alt="${title} Logo" />
            </div>
            <p class="hero-tagline">${
              `New on ${video.sourceType}` || "NEW MOVIE ORIGINAL"
            }</p>
            <div class="hero-stats">
              <span class="trending">#Trending Now</span>
              <span class="rating">★ ${rating}</span>
            </div>
            <div class="hero-genres">
              <span class="genre">${genres}</span>
            </div>
            <p class="hero-desc">${description}</p>
            <div class="hero-cta">
              <button class="btn-play" aria-label="Watch Now">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>
                Watch Now
              </button>
              <button class="btn-icon" aria-label="Bookmark"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h12v18l-6-5-6 5z"></path></svg></button>
              <button class="btn-icon" aria-label="More info"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 6h.01m-1 4h2v6h-2z"></path></svg></button>
            </div>
          </div>
          </div>
      </div>
    `;
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
      return;
    }

    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.classList.toggle("active", i === index);
      });
    }

    function nextSlide() {
      currentIndex = (currentIndex + 1) % slides.length;
      showSlide(currentIndex);
    }

    function prevSlide() {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      showSlide(currentIndex);
    }

    function startAutoplay() {
      stopAutoplay();
      slideInterval = setInterval(nextSlide, 10 * 1000);
    }

    function stopAutoplay() {
      clearInterval(slideInterval);
    }

    nextBtn.addEventListener("click", () => {
      nextSlide();
      startAutoplay();
    });

    prevBtn.addEventListener("click", () => {
      prevSlide();
      startAutoplay();
    });

    showSlide(currentIndex);
    startAutoplay();
  }

  async function loadHeroSection() {
    if (!heroSliderContainer) return;

    const videos = await fetchHeroVideos();

    if (videos.length > 0) {
      heroSliderContainer.innerHTML = videos.map(createHeroSlideHTML).join("");
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
    initializeDynamicSliders();
    initializeGeneralUI();
    initializePlayerPreviews();
  }

  main();
});
