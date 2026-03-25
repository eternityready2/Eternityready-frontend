// script.js

  /**
   * Cria o HTML para um único card de vídeo.
   * @param {object} video O objeto de vídeo da API.
   * @returns {string} A string HTML do card.
   */
  function createVideoCard(video) {
    // Ensure function is accessible globally
    if (!video) return '';
    const API_BASE_URL = "https://api.eternityready.com/";
    let imageUrl,
      playerUrl,
      targetAttribute = "";
    const encodedTitle = encodeURIComponent(video.title || video.id);
    const id = encodeURIComponent(video.id);
    const thumbUrl = (video.thumbnail?.url || "").trim();

    switch (video.sourceType) {
      case "radio":
        imageUrl = thumbUrl.startsWith("http")
          ? thumbUrl
          : `${API_BASE_URL}${thumbUrl.replace(/^\//, "")}`;
        playerUrl = `/radio/?item=${id}`;
        break;
      case "music":
      case "channels":
      case "movies":
        imageUrl = thumbUrl.startsWith("http")
          ? thumbUrl
          : `${API_BASE_URL}${thumbUrl.replace(/^\//, "")}`;
        playerUrl = `/player/?q=${encodedTitle}`;
        break;
      case "podcasts":
        imageUrl = thumbUrl.startsWith("http")
          ? thumbUrl
          : `https://keystone.eternityready.com${thumbUrl}`;
        playerUrl = `https://podcasts.eternityready.com/episodes/${video.slug}`;
        targetAttribute = 'target="_blank" rel="noopener noreferrer"';
        break;
      default:
        imageUrl = thumbUrl
          ? (thumbUrl.startsWith("http") ? thumbUrl : `${API_BASE_URL}${thumbUrl.replace(/^\//, "")}`)
          : "../images/placeholder.jpg";
        playerUrl = `/player/?q=${encodedTitle}`;
        break;
    }
  
    const openCmd = targetAttribute.includes('_blank') ? `window.open('${playerUrl}','_blank')` : `window.location.href='${playerUrl}'`;
    return `
      <div class="media-card-link" onclick="if(!event.target.closest('.category-tag'))${openCmd}">
        <div class="media-card">
          <div class="media-thumb">
            <img src="${imageUrl}" alt="${video.title}" loading="lazy" />
            ${
              video.duration
                ? `<span class="media-duration">${video.duration}</span>`
                : ""
            }
          </div>
          <div class="media-info-col">
            <p class="media-title">${video.title}</p>
            <div class="media-subinfo">
              <p class="media-genre">${renderCategoryTags(video.categories)}</p>
              <p class="media-by">by <span class="media-author">${
                video.author || "EternityReady"
              }</span></p>
            </div>
          </div>
        </div>
      </div>`;
  }
  
  // Explicitly attach to window for global access
  window.createVideoCard = createVideoCard;
  
  document.addEventListener("DOMContentLoaded", () => {
    //
    // ─── CONFIGURAÇÕES GLOBAIS E FUNÇÕES DA API ───────────────────────────────────────
    //
    const API_BASE_URL = "https://api.eternityready.com/";
    const PODCAST_API_URL = "https://keystone.eternityready.com/api/podcasts?limit=9999";
    let normalizedLocalDataCache = null;
  
    /**
     * Busca as categorias de vídeo da API.
     * @returns {Promise<Array>} Uma promessa que resolve para um array de categorias.
     */
    async function fetchCategories() {
      try {
        const response = await fetch(`${API_BASE_URL}api/categories`);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return (await response.json()) || [];
      } catch (error) {
        console.error("Falha ao buscar categorias:", error);
        return [];
      }
    }
  
    async function loadLocalDataSources() {
      const promises = [
        fetch("/data/channels.json"),
        fetch("/data/movies.json"),
        fetch("/data/music.json"),
        fetch("/data/radio.json"),
        fetch(PODCAST_API_URL).catch(() => ({ ok: false })),
      ];
      const results = await Promise.allSettled(promises);
      const localData = { channels: [], movies: [], music: [], radio: [], podcasts: [] };

      const fileKeys = ["channels", "movies", "music", "radio"];
      for (let index = 0; index < 4; index++) {
        const result = results[index];
        const key = fileKeys[index];
        if (result.status === "fulfilled" && result.value.ok) {
          try {
            const data = await result.value.json();
            if (key === "radio") {
              localData.radio = data.channels || [];
            } else {
              localData[key] = data[key] || [];
            }
          } catch (e) {
            console.error(`Falha ao processar /data/${key}.json`);
          }
        } else {
          console.error(`Falha ao carregar /data/${key}.json`);
        }
      }

      if (results[4].status === "fulfilled" && results[4].value.ok) {
        try {
          const podcastJson = await results[4].value.json();
          localData.podcasts = podcastJson.data || [];
        } catch (e) {
          console.error("Falha ao processar dados de podcasts.");
        }
      } else {
        console.error("Falha ao carregar dados de podcasts.");
      }
      return localData;
    }
  
    /**
     * Carrega, normaliza e armazena em cache todos os dados locais.
     * @returns {Promise<Array>} Uma promessa que resolve para um array com todos os itens locais normalizados.
     */
    async function getAllNormalizedLocalData() {
      if (normalizedLocalDataCache) {
        return normalizedLocalDataCache;
      }
  
      const localData = await loadLocalDataSources();
      const allItems = [];
  
      (localData.channels || []).forEach((item) =>
        allItems.push({ ...normalizeLocalItem(item), sourceType: "channels" })
      );
      (localData.movies || []).forEach((item) =>
        allItems.push({ ...normalizeLocalItem(item), sourceType: "movies" })
      );
      (localData.music || []).forEach((item) =>
        allItems.push({ ...normalizeLocalItem(item), sourceType: "music" })
      );
      (localData.radio || []).forEach((item) =>
        allItems.push(normalizeRadioItem(item))
      );
      (localData.podcasts || []).forEach((item) =>
        allItems.push(normalizePodcastItem(item))
      );
  
      normalizedLocalDataCache = allItems;
      return allItems;
    }
  
    //
    // ─── LÓGICA DA BARRA DE PESQUISA DINÂMICA ─────────────────────────────────────────
    //
    async function initializeSearch() {
      const input = document.getElementById("search-input-new");
      const dropdown = document.getElementById("search-dropdown");
      if (!input || !dropdown) return;
  
      const historyList = document.getElementById("history-list");
      const noHistory = document.getElementById("no-history");
      const categoriesList = document.getElementById("categories-list");
      const categoriesSection = document.getElementById("categories-section");
      const historySection = document.getElementById("history-section");
      const mediaSection = document.getElementById("media-section");
      const mediaList = document.getElementById("media-list");
      const trendingList = document.getElementById("trending-list");
      const seeAllLink = document.getElementById("see-all");
  
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
        try {
          const url = `${API_BASE_URL}api/search?search_query=${encodeURIComponent(
            query
          )}`;
          const response = await fetch(url);
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          return data.videos || [];
        } catch (error) {
          console.error(`Falha ao buscar mídia: ${error}`);
          return [];
        }
      }
  
      function renderTrending() {
        if (!trendingList) return;
        trendingList.innerHTML = "";
        trending.forEach((t) => {
          const btn = document.createElement("button");
          btn.className = "chip";
          btn.textContent = t;
          btn.onclick = () => {
            input.value = t;
            input.dispatchEvent(
              new Event("input", {
                bubbles: true,
              })
            );
          };
          trendingList.appendChild(btn);
        });
      }
  
      function renderCategories(categoriesData) {
        if (!categoriesList) return;
        categoriesList.innerHTML = "";
        categoriesData.slice(0, 6).forEach((category) => {
          const btn = document.createElement("button");
          btn.className = "chip";
          btn.textContent = category.name;
          btn.onclick = () => {
            input.value = category.name;
            input.dispatchEvent(
              new Event("input", {
                bubbles: true,
              })
            );
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
            '<li class="search-feedback">Nenhum resultado encontrado.</li>';
          return;
        }
  
        videos.slice(0, 5).forEach((video) => {
          const imageUrl = video.thumbnail?.url
            ? `${API_BASE_URL}${video.thumbnail.url.replace(/^\//, "")}`
            : "../images/placeholder.jpg";
          const videoUrl = `/player/?q=${video.id}`;
  
          const li = document.createElement("li");
          li.className = "media-item";
          li.innerHTML = `
            <a href="${videoUrl}" class="media-item-link">
              <img src="${imageUrl}" alt="${video.title}">
              <div class="media-info">
                <p class="media-title">${video.title}</p>
                <p class="media-meta">${video.categories
                  .map((c) => c.name)
                  .join(", ")}</p>
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
            input.dispatchEvent(
              new Event("input", {
                bubbles: true,
              })
            );
          };
          historyList.appendChild(li);
        });
  
        renderCategories(availableCategories);
        renderTrending();
  
        seeAllLink.textContent = "Ver todos os resultados »";
        seeAllLink.href = "/search";
      }
  
      const performLiveSearch = async (event) => {
        const query = event.target.value.trim();
        if (query) {
          seeAllLink.href = `/search?query=${encodeURIComponent(query)}`;
          seeAllLink.textContent = `Ver todos os resultados para "${query}" »`;
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
          debouncedSearch({
            target: {
              value: input.value,
            },
          });
        }
      });
  
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const query = input.value.trim();
          if (query) {
            history = [query, ...history.filter((h) => h !== query)].slice(0, 5);
            localStorage.setItem("searchHistory", JSON.stringify(history));
            window.location.href = `/search?query=${encodeURIComponent(query)}`;
          }
        }
      });
  
      document.addEventListener("click", (e) => {
        if (!document.querySelector(".search-container")?.contains(e.target)) {
          dropdown.style.display = "none";
        }
      });
    }
  
    //
    // ─── LÓGICA DA PÁGINA DE CATEGORIA ────────────────────────────────────────────────
    //
    async function handleCategoryPage() {
      const dynamicContentArea = document.getElementById("dynamic-content-area");
      if (!dynamicContentArea) return;
  
      const urlParams = new URLSearchParams(window.location.search);
      const categoryQuery = urlParams.get("category");
  
      if (!categoryQuery) {
        dynamicContentArea.innerHTML =
          "<p>Nenhuma categoria foi fornecida na URL.</p>";
        return;
      }
  
      dynamicContentArea.innerHTML = `<p class="loading-feedback">Carregando vídeos para ${categoryQuery}...</p>`;
  
      let allMedia = [];
      let currentFilters = { name: "", genre: "all", sort: "title-asc" };
  
      const categoryToSourceType = {
        Channels: "channels",
        Movies: "movies",
        Music: "music",
        Podcasts: "podcasts",
        Radio: "radio",
      };

      const allLocalData = await getAllNormalizedLocalData();
      const sourceType = categoryToSourceType[categoryQuery];

      if (sourceType) {
        // Source-type page: show all items of that type
        allMedia = allLocalData.filter((item) => item.sourceType === sourceType);
      } else {
        // Category page: filter by matching category name (case-insensitive)
        allMedia = allLocalData.filter((item) =>
          item.categories.some(
            (cat) => cat.name.toLowerCase() === categoryQuery.toLowerCase()
          )
        );
      }
  
      if (allMedia.length === 0) {
        dynamicContentArea.innerHTML = `<p>Nenhum vídeo foi encontrado para esta categoria.</p>`;
        return;
      }
  
      const uniqueGenres = [
        ...new Set(
          allMedia.flatMap((item) => item.categories.map((c) => c.name))
        ),
      ].sort();
  
      function renderMedia(mediaToRender) {
        const grid = document.querySelector(".media-grid.all-videos-grid");
        if (!grid) return;
  
        const videoCountSpan = document.getElementById("video-count");
        if (videoCountSpan) videoCountSpan.textContent = mediaToRender.length;
  
        if (mediaToRender.length === 0) {
          grid.innerHTML =
            '<p class="no-results-feedback">Nenhum item corresponde aos filtros aplicados.</p>';
          return;
        }
        
        // Verify createVideoCard is available (check both global and window)
        const cardFunction = window.createVideoCard || createVideoCard;
        if (typeof cardFunction !== 'function') {
          console.error('createVideoCard is not a function!', typeof createVideoCard, typeof window.createVideoCard);
          return;
        }
        
        grid.innerHTML = mediaToRender.map(cardFunction).join("");
      }
  
      function applyFiltersAndRender() {
        let filteredMedia = [...allMedia];
  
        if (currentFilters.name) {
          filteredMedia = filteredMedia.filter((item) =>
            item.title.toLowerCase().includes(currentFilters.name)
          );
        }
  
        if (currentFilters.genre !== "all") {
          filteredMedia = filteredMedia.filter((item) =>
            item.categories.some((cat) => cat.name === currentFilters.genre)
          );
        }
  
        switch (currentFilters.sort) {
          case "title-asc":
            filteredMedia.sort((a, b) => a.title.localeCompare(b.title));
            break;
          case "title-desc":
            filteredMedia.sort((a, b) => b.title.localeCompare(a.title));
            break;
        }
  
        renderMedia(filteredMedia);
      }
  
      const genreOptions = uniqueGenres
        .map((genre) => `<option value="${genre}">${genre}</option>`)
        .join("");
      dynamicContentArea.innerHTML = `
        <a class="backHome-Button" href="/new-homepage/">Back Home</a><br>
        <h1 class="section-title">${categoryQuery} <span><span id="video-count">${allMedia.length}</span> Vídeos</span></h1>
        <div class="filters-container">
          <div class="filter-group">
            <label for="name-filter">Filter by name::</label>
            <input type="text" id="name-filter" placeholder="Enter the video name..." autocomplete="off">
          </div>
          <div class="filter-group">
            <label for="genre-filter">Genre:</label>
            <select id="genre-filter">
              <option value="all">All genres</option>
              ${genreOptions}
            </select>
          </div>
          <div class="filter-group">
            <label for="sort-filter">Sort by:</label>
            <select id="sort-filter">
              <option value="title-asc">Name (A-Z)</option>
              <option value="title-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
        <section class="media-section">
          <div class="all-videos-section">
            <div class="media-grid all-videos-grid"></div>
          </div>
        </section>`;
  
      document.getElementById("name-filter").addEventListener(
        "input",
        debounce((e) => {
          currentFilters.name = e.target.value.toLowerCase();
          applyFiltersAndRender();
        }, 300)
      );
      document.getElementById("genre-filter").addEventListener("change", (e) => {
        currentFilters.genre = e.target.value;
        applyFiltersAndRender();
      });
      document.getElementById("sort-filter").addEventListener("change", (e) => {
        currentFilters.sort = e.target.value;
        applyFiltersAndRender();
      });
  
      applyFiltersAndRender();
    }
  
    //
    // ─── INICIALIZAÇÃO DE UI GERAL (SLIDERS, MENU MOBILE) ───────────────────────────
    //
    function initializeAllSlidersAndUI() {
      // --- Setas e Drag-to-Scroll para TODOS os sliders ---
      document.querySelectorAll(".slider-wrapper").forEach((wrapper) => {
        const slider = wrapper.querySelector(
          ".media-grid, .browse-slider, .people-slider"
        );
        const prevBtn = wrapper.querySelector(".slider-arrow.prev");
        const nextBtn = wrapper.querySelector(".slider-arrow.next");
  
        if (!slider) return;
  
        if (prevBtn && nextBtn) {
          const scrollAmount = slider.clientWidth * 0.8;
          prevBtn.addEventListener("click", () =>
            slider.scrollBy({
              left: -scrollAmount,
              behavior: "smooth",
            })
          );
          nextBtn.addEventListener("click", () =>
            slider.scrollBy({
              left: scrollAmount,
              behavior: "smooth",
            })
          );
        }
  
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
        slider.addEventListener("touchstart", startDrag, {
          passive: true,
        });
        slider.addEventListener("touchmove", moveDrag, {
          passive: false,
        });
        slider.addEventListener("touchend", endDrag);
      });
    }
  
    //
    // ─── PONTO DE ENTRADA PRINCIPAL ───────────────────────────────────────────────────
    //
    async function main() {
      initializeSearch();
      initializeAllSlidersAndUI();
  
      if (document.getElementById("dynamic-content-area")) {
        handleCategoryPage();
      }
    }
  
    main();
  });
  
  