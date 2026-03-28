import { getEternityRadioPlayerRef } from './dist20/ui.es.js';
function initializeSliderControls(context = document) {
  context.querySelectorAll(".slider-wrapper").forEach((wrapper) => {

    let slider = wrapper.querySelector(".media-grid");

    const prevBtn = wrapper.querySelector(".slider-arrow.prev");
    const nextBtn = wrapper.querySelector(".slider-arrow.next");

    if (!slider || !prevBtn || !nextBtn) return;

    let itemCount = slider.querySelectorAll(".media-card-link").length;

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
      startX = (e.pageX !== undefined ? e.pageX : e.touches[0].pageX) - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    };
    const moveDrag = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = (e.pageX !== undefined ? e.pageX : e.touches[0].pageX) - slider.offsetLeft;
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

async function runAfterAllMedia(allMedia, position) {
  await window.renderAllRecommendationSliders(
    allMedia,
    '#main-container',
    ['radio', 'music']
  );
}

function waitForAllMedia(position) {
  if ( isNormalized == true) {
    runAfterAllMedia([
      ...normalizedData.channels,
      ...normalizedData.movies,
      ...normalizedData.music,
    ], position);
  } else {
    setTimeout(() => waitForAllMedia(position), 50);
  }
}

// Aguarda o DOM estar completamente carregado para executar o script
document.addEventListener("DOMContentLoaded", () => {
  // =================================================================================
  // 1. ESTADO DA APLICAÇÃO E CACHE DE ELEMENTOS
  // =================================================================================
  // Armazena os dados carregados para evitar novas requisições
  let allChannels = [];
  let allMovies = [];
  let savedChannels = []; // Array que será a fonte da verdade para canais salvos

  // Guarda referências para elementos do DOM que não mudam
  const mainContainer = document.getElementById("main-container");
  const channelButton = document.getElementById("channel-button");
  const movieButton = document.getElementById("movie-button");
  const modal = document.getElementById("modal");
  const closeModalBtn = document.getElementById("closeBtn");

  // =================================================================================
  // 2. INICIALIZAÇÃO
  // =================================================================================
  // Função principal que inicia a aplicação
  async function init() {
    setupEventListeners();

    // Carrega os canais salvos dos cookies
    savedChannels = getSavedChannelsFromCookies();

    try {
      const [channelData, movieData] = await Promise.all([
        fetch("/data/radio.json").then((res) => res.json()),
        fetch("/data/music.json").then((res) => res.json()),
      ]);

      allChannels = channelData.channels.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      allMovies = movieData.music.sort((a, b) =>
        a.title.localeCompare(b.title)
      );

      const urlParams = new URLSearchParams(window.location.search);
      const itemId = urlParams.get("id");

      if (itemId) {
        const allMedia = [...allMovies, ...allChannels];

        const itemToShow = allMedia.find(
          (item) => (item.id || item.id) === decodeURIComponent(itemId)
        );

        if (itemToShow) {
          if (itemToShow.logo) {
            const radioIndex = allChannels.findIndex(
              (radio) => radio.name === itemToShow.name
            );
            if (radioIndex > -1) {
              updateView("channel");
              playRadio(itemToShow, radioIndex);
            }
          } else {
            updateView("movie");
            openChannelModal(itemToShow);
          }
        } else {
          console.warn(`Item com ID "${itemId}" não encontrado.`);
          updateView("channel");
        }
      } else {
        updateView("channel");
      }

      if (window.updatePrograms) {
        window.updatePrograms();
      }
    } catch (error) {
      mainContainer.innerHTML =
        "<h2>Error loading data. Please try again later.</h2>";
      console.error("Error loading data:", error);
    }
  }

  // =================================================================================
  // 3. GERENCIAMENTO DE EVENTOS (LISTENERS)
  // =================================================================================
  // Configura todos os listeners estáticos da página
  function setupEventListeners() {
    channelButton.addEventListener("click", () => updateView("channel"));
    movieButton.addEventListener("click", () => updateView("movie"));
    closeModalBtn.addEventListener("click", closeModal);

    // Listener para fechar o modal ao clicar fora dele
    window.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });

    // Delegação de Eventos: um único listener no container principal
    mainContainer.addEventListener("input", handleDynamicInput);
    mainContainer.addEventListener("change", handleDynamicChange);
  }

  // >>>>> MODIFICADO: Adicionado listener para filtros de filmes <<<<<
  function handleDynamicInput(event) {
    if (event.target.id === "search-input") {
      applyChannelFilters();
    } else if (event.target.id === "movie-search-input") {
      //applyMovieFilters();
      applyChannelFilters();
    }
  }

  // >>>>> MODIFICADO: Adicionado listener para filtros de filmes <<<<<
  function handleDynamicChange(event) {
    if (event.target.id === "categoryFilter") {
      applyChannelFilters();
    } else if (event.target.id === "movie-genre-filter") {
      //applyMovieFilters();
      applyChannelFilters();
    }
  }

  // =================================================================================
  // 4. GERENCIAMENTO DE VIEWS
  // =================================================================================
  function updateView(viewName) {
    // Limpa o container
    mainContainer.innerHTML = "";

    // Atualiza o estado ativo dos botões
    channelButton.classList.toggle("ativo", viewName === "channel");
    movieButton.classList.toggle("ativo", viewName === "movie");

    // Renderiza a view correspondente
    if (viewName === "channel") {
      renderChannelView("radio");
      waitForAllMedia("radio");
    } else if (viewName === "movie") {
      //renderMovieView();
      renderChannelView("music");
      waitForAllMedia("music");
    }
  }

  // =================================================================================
  // 5. LÓGICA DE RENDERIZAÇÃO
  // =================================================================================

  // --- RENDERIZAÇÃO DA VIEW DE CANAIS ---
  function renderChannelView(groupContent = "all") {
    const channelViewHTML = `
        <div id="channel-carousels-container"></div>
        <div id="saved-channels-container"></div>
        <div class="search-section">
            <h2>Browse Radio Stations & Music Videos</h2>
            <div class="channelssearch">
                <div class="second-search-parent">
                    <div class="second-search-bar">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="search-input" placeholder="Search for content..."/>
                    </div>
                    <select id="categoryFilter">
                        <option value="all">All Categories</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="cardbg">
            <div class="main-parent">
                <div class="count">
                    <p id="channel-count">radios</p>
                </div>
                <div id="channel-grid" class="channel-grid"></div>
            </div>
        </div>
    `;
    mainContainer.innerHTML = channelViewHTML;

    // 1. Render channel carousels using MOVIE classes and structure
    const groupedChannels = { featured: [], popular: [], sports: [] };
    allChannels.forEach((channel) => {
      (channel.tags || []).forEach((tag) => {
        if (groupedChannels[tag]) groupedChannels[tag].push(channel);
      });
    });

    const carouselsContainer = document.getElementById(
      "channel-carousels-container"
    );
    Object.entries({
      featured: "Featured",
      popular: "Popular",
    }).forEach(([tag, title]) => {
      const channelsInGroup = groupedChannels[tag];
      if (channelsInGroup && channelsInGroup.length > 0) {
        const sectionDiv = document.createElement("div");
        sectionDiv.className = "movie-section"; // Using MOVIE class here
        sectionDiv.innerHTML = `
                <h2>${title}</h2>
                <div class="swiper">
                    <div class="swiper-wrapper"></div>
                    <div class="swiper-button-prev"></div>
                    <div class="swiper-button-next"></div>
                </div>`;

        // Wrap in the same structure as movies
        const cardBgWrapper = document.createElement("div");
        cardBgWrapper.className = "cardbgg";
        const mainParentWrapper = document.createElement("div");
        mainParentWrapper.className = "main-parent";

        mainParentWrapper.appendChild(sectionDiv);
        cardBgWrapper.appendChild(mainParentWrapper);
        carouselsContainer.appendChild(cardBgWrapper);

        const swiperWrapper = sectionDiv.querySelector(".swiper-wrapper");
        channelsInGroup.forEach((channel) => {
          const card = createChannelCard(channel);
          const slide = document.createElement("div");
          slide.className = "swiper-slide";
          slide.appendChild(card);
          swiperWrapper.appendChild(slide);
        });

        new Swiper(sectionDiv.querySelector(".swiper"), {
          slidesPerView: "auto",
          spaceBetween: 8,
          navigation: {
            nextEl: sectionDiv.querySelector(".swiper-button-next"),
            prevEl: sectionDiv.querySelector(".swiper-button-prev"),
          },
          breakpoints: {
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 5 },
          },
        });
      }
    });

    // 2. Original channel view setup
    const categoryFilterElement = document.getElementById("categoryFilter");
    populateCategories(allChannels, categoryFilterElement, "categories");
    populateCategories(allMovies, categoryFilterElement, "categories");
    renderSavedList();
    applyChannelFilters(groupContent);
  }

  // --- RENDERIZAÇÃO DA VIEW DE FILMES (MODIFICADA) ---
  function renderMovieView() {
    const player = document.getElementById("player-bar");
    player.classList.remove("ativo");
    pauseSong();

    const movieContainer = document.createElement("div");
    movieContainer.id = "movie-sections-container";
    mainContainer.appendChild(movieContainer);

    // 1. Renderiza os Carrosséis (código original)
    const groupedMovies = { featured: [], popular: [], new: [] };
    allMovies.forEach((movie) => {
      (movie.tags || []).forEach((tag) => {
        if (groupedMovies[tag]) groupedMovies[tag].push(movie);
      });
    });

    Object.entries({
      featured: "Featured",
      popular: "Popular",
    }).forEach(([tag, title]) => {
      const moviesInGroup = groupedMovies[tag];
      if (moviesInGroup && moviesInGroup.length > 0) {
        const sectionDiv = document.createElement("div");
        sectionDiv.className = "movie-section";
        sectionDiv.innerHTML = `
                    <h2>${title}</h2>
                    <div class="swiper">
                        <div class="swiper-wrapper"></div>
                        <div class="swiper-button-prev"></div>
                        <div class="swiper-button-next"></div>
                    </div>`;

        const swiperWrapper = sectionDiv.querySelector(".swiper-wrapper");
        moviesInGroup.forEach((movie) => {
          const card = createMovieCard(movie);
          const slide = document.createElement("div");
          slide.className = "swiper-slide";
          slide.appendChild(card);
          swiperWrapper.appendChild(slide);
        });
        movieContainer.appendChild(sectionDiv);
        new Swiper(sectionDiv.querySelector(".swiper"), {
          slidesPerView: "auto",
          spaceBetween: 8,
          navigation: {
            nextEl: sectionDiv.querySelector(".swiper-button-next"),
            prevEl: sectionDiv.querySelector(".swiper-button-prev"),
          },
          breakpoints: {
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 5 },
          },
        });
      }
    });

    // 2. Renderiza a nova Grid de Todos os Filmes
    const allMoviesGridHTML = `
            <div class="second-search-section" style="margin-top: 40px;">
                <h2>Browse all musics</h2>
                <div class="second-search-parent">
                    <div class="second-search-bar">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="movie-search-input" placeholder="Search music videos..."/>
                    </div>
                    <select id="movie-genre-filter">
                        <option value="all">All Genres</option>
                    </select>
                </div>
            </div>
            <div class="cardbg">
                <div class="main-parent">
                    <div class="count">
                        <p id="movie-count">musics</p>
                    </div>
                    <div id="movie-grid" class="channel-grid"></div>
                </div>
            </div>
        `;
    // Adiciona a nova seção ao container principal
    mainContainer.insertAdjacentHTML("beforeend", allMoviesGridHTML);

    const genreFilterElement = document.getElementById("movie-genre-filter");
    // Assumindo que a propriedade se chama 'genres' no seu JSON de filmes
    populateCategories(allMovies, genreFilterElement, "categories");
    applyMovieFilters();
  }

  // --- FUNÇÕES DE RENDERIZAÇÃO DE GRIDS ---
  function renderChannelGrid(channelsToRender, groupContent) {
    const channelGrid = document.getElementById("channel-grid");
    channelGrid.innerHTML = "";

    currentPlaylist = channelsToRender;

    channelsToRender.forEach((channel, index) => {
      channelGrid.appendChild(createChannelCard(channel, index));
    });

    let channelCountText;
    if (groupContent == "all") {
      channelCountText = `Radio & Music found: ${channelsToRender.length}`
    }

    else if (groupContent == "radio") {
      channelCountText = `Radio found: ${channelsToRender.length}`
    }
    
    else {
      channelCountText = `Music found: ${channelsToRender.length}`
    }

    document.getElementById(
      "channel-count"
    ).textContent = channelCountText;
  }

  // >>>>> NOVO: Função para renderizar a grid de filmes <<<<<
  function renderMovieGrid(moviesToRender) {
    const movieGrid = document.getElementById("movie-grid");
    movieGrid.innerHTML = ""; // Limpa a grid antes de adicionar novos itens
    moviesToRender.forEach((movie) => {
      movieGrid.appendChild(createMovieCard(movie));
    });
    document.getElementById(
      "movie-count"
    ).textContent = `Results found: ${moviesToRender.length}`;
  }

  function renderSavedChannels() {
    const savedContainer = document.getElementById("saved-channels-container");
    savedContainer.innerHTML = "";

    const savedChannelObjects = allChannels.filter((ch) =>
      isChannelSaved(ch.name)
    );

    if (savedChannelObjects.length > 0) {
      const cardBgWrapper = document.createElement("div");
      cardBgWrapper.className = "cardbgg";

      const mainParentWrapper = document.createElement("div");
      mainParentWrapper.className = "main-parent";

      const sectionDiv = document.createElement("div");
      sectionDiv.className = "movie-section";
      sectionDiv.innerHTML = `
        <h2>Saved Channels</h2>
        <div class="swiper" id="saved-channels-swiper">
            <div class="swiper-wrapper"></div>
            <div class="swiper-button-prev"></div>
            <div class="swiper-button-next"></div>
        </div>`;

      mainParentWrapper.appendChild(sectionDiv);
      cardBgWrapper.appendChild(mainParentWrapper);
      savedContainer.appendChild(cardBgWrapper);

      const swiperWrapper = sectionDiv.querySelector(".swiper-wrapper");
      savedChannelObjects.forEach((channel, index) => {
        const card = createChannelCard(channel, index);
        const slide = document.createElement("div");
        slide.className = "swiper-slide";
        slide.appendChild(card);
        swiperWrapper.appendChild(slide);
      });

      new Swiper(sectionDiv.querySelector("#saved-channels-swiper"), {
        slidesPerView: "auto",
        spaceBetween: 8,
        navigation: {
          nextEl: sectionDiv.querySelector(".swiper-button-next"),
          prevEl: sectionDiv.querySelector(".swiper-button-prev"),
        },
        breakpoints: {
          640: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 5 },
        },
      });
    }
  }

  // =================================================================================
  // 6. CRIAÇÃO DE ELEMENTOS (CARDS)
  // =================================================================================
  function createChannelCard(channel, index) {
    const card = document.createElement("div");
    card.className = "channel-card";
    //const isSaved = isChannelSaved(channel.name);

    const categories = channel.categories.sort().join(", ");

    let sisterBannerHTML;
    if (channel?.title == null) {
      const isSisterStation = channel?.title == null && channel.tags && channel.tags.includes("sister");
      sisterBannerHTML = isSisterStation
        ? `<div class="sister-station-banner">Sister</div>`
        : "";
    } else {
      sisterBannerHTML = `<div class="sister-station-banner">Music</div>`
    }

    card.innerHTML = `
            ${sisterBannerHTML}
            <img src="${channel.logo || channel.thumbnail}" alt="${channel.name || channel.title}">
            <div class="channel-details">
              <div class="channel-content">
                <h3>${channel.name || channel.title}</h3>
                <button class="watch-later-btn" data-channel="${channel.name || channel.title}">
                  <i class="fa-solid fa-bookmark bookmark-icon ${
                    "active"
                  }"></i>
                  <div class="spinner">
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                  </div>
                </button>
              </div>

              <div class="channel-categorie">${categories}</div>
            </div>
            `;

      card.addEventListener("click", () => {
        if (channel?.title != null) {
          window.location.assign(`${ETERNITY_BASE_URL}/player?q=${encodeURIComponent(channel.title)}`)
          return;
        }

        const eternityRadioRef = getEternityRadioPlayerRef();
        if (eternityRadioRef && eternityRadioRef.current) {
          console.log('channelClicked', channel);
          eternityRadioRef.current.changeExternalStation(channel);
          try {
            const deviceType = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
            const previousRadio = sessionStorage.getItem("previousRadio");
            const globalUserTracking = getTracking();
            globalUserTracking['sessions'][channel.name] = (
              globalUserTracking?.['sessions']?.[channel.name]
              ?? {
                  "origin": "radio",
                  "categories": channel.categories,
                  "total_consumption_seconds": 0,
                  "timestamps": [],
                  "metadata": {
                    "device": [],
                    "average_watch_seconds": 0,
                    "referrers": {},
                  }
                }
            );

            const trackingSession = globalUserTracking['sessions'][channel.name]
            console.log('prev', previousRadio, channel.name, trackingSession, globalUserTracking['sessions'][channel.name]);
            try {
              if (previousRadio && previousRadio !== channel.name) {
                const referrers = trackingSession.metadata.referrers;
                referrers[previousRadio] = (referrers[previousRadio] ?? 0) + 1;

                const radio = globalUserTracking?.['sessions']?.[previousRadio]
                const timestamps = radio['timestamps'];
                const last = timestamps[timestamps.length - 1];
                last.end = Date.now();

                // Calculate new watch segment duration
                const sessionSeconds = (last.end - last.start) / 1000.0;
                radio['total_consumption_seconds'] += sessionSeconds;

                // Update average watch time per session segment
                const totalSegments = timestamps.length;
                radio['metadata']['average_watch_seconds'] = 
                  radio['total_consumption_seconds'] / totalSegments;

                setTracking(globalUserTracking);
              }
            } catch (error) {
              console.error("previousRadioError", error);
            }

            trackingSession['metadata']['device'].push(deviceType);
            trackingSession['timestamps'].push({ start: Date.now() });
            sessionStorage.setItem("previousRadio", channel.name);
            setTracking(globalUserTracking);

            // Sync categoriesConsumed in localStorage for the recommendation engine
            const stored = localStorage.getItem("categoriesConsumed");
            const categoriesConsumed = stored ? JSON.parse(stored) : {};
            for (const cat of (channel.categories || [])) {
              categoriesConsumed[cat] = (categoriesConsumed[cat] ?? 0) + 1;
            }
            localStorage.setItem("categoriesConsumed", JSON.stringify(categoriesConsumed));

            if (typeof reportCommunityEngagement === "function") reportCommunityEngagement(channel.name, "radio", "play");

          } catch (error) {
            console.error("userTrackingError", error);
          }

        }
      });

    const watchLaterBtn = card.querySelector(".watch-later-btn");
    watchLaterBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleSaveClick(channel, card);
    });
    return card;
  }

  function createMovieCard(movie) {
    const card = document.createElement("div");
    card.className = "movie-card"; // Reutilize o estilo se já tiver
    card.innerHTML = `
        <img src="${movie.thumbnail}" alt="${movie.title}">
        <div class="content-banner">Music Video</div>
        <div class="movie-details">
            <h3>${movie.title}</h3>
        </div>
    `;
    //card.addEventListener("click", () => openChannelModal(movie));
    card.addEventListener("click", () => {
      window.location.assign(`${ETERNITY_BASE_URL}/player?q=${encodeURIComponent(movie.title || movie.name)}`)
    });
    return card;
  }

  // =================================================================================
  // 7. LÓGICA DE AÇÕES DO USUÁRIO
  // =================================================================================
  async function handleSaveClick(channel, cardElement) {
    const watchLaterBtn = cardElement.querySelector(".watch-later-btn");
    const spinner = watchLaterBtn.querySelector(".spinner");
    const bookmarkIcon = watchLaterBtn.querySelector(".bookmark-icon");

    // Show loading state
    spinner.style.display = "block";
    bookmarkIcon.style.display = "none";

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Toggle save state
    const title = channel.name ?? channel.title
    const isCurrentlySaved = isChannelSaved(title);
    if (isCurrentlySaved) {
      removeChannelFromCookies(title);
      savedChannels = savedChannels.filter((name) => name !== title);
    } else {
      saveChannelToCookies(title);
      savedChannels.push(title);
    }

    // Update ONLY the clicked card's visual state
    bookmarkIcon.classList.toggle("active", !isCurrentlySaved);

    // Update saved channels lists without full re-render
    updateSavedChannelsUI();

    // Restore icon
    spinner.style.display = "none";
    bookmarkIcon.style.display = "block";
  }

  function updateSavedChannelsUI() {
    renderSavedList();
    // Only update filters if needed
    if (document.getElementById("categoryFilter").value !== "all") {
      applyChannelFilters();
    }
  }
  function renderSavedList() {
    const savedListContainer = document.getElementById("savedList");
    savedListContainer.innerHTML = "";

    const savedChannelObjects = [...allChannels, ...allMovies].filter((ch) =>
      isChannelSaved(ch.name ?? ch.title)
    );
    const emptyMessage = document.querySelector(".wejaskdscs");

    if (savedChannelObjects.length > 0) {
      // Hide "no items" message if it exists
      if (emptyMessage) emptyMessage.style.display = "none";

      const savedGrid = document.createElement("div");
      savedGrid.className = "channel-grid";

      savedChannelObjects.forEach((channel) => {
        savedGrid.appendChild(createChannelCard(channel));
      });

      savedListContainer.appendChild(savedGrid);
      savedListContainer.classList.add("cardbg");

      const mainParent = document.createElement("div");
      mainParent.className = "main-parent";
      savedListContainer.insertBefore(mainParent, savedGrid);
      mainParent.appendChild(savedGrid);
    } else {
      // Show "no items" message when empty
      if (emptyMessage) {
        emptyMessage.style.display = "block";
      } else {
        const message = document.createElement("p");
        message.className = "wejaskdscs";
        message.textContent = "No items in watch later";
        savedListContainer.appendChild(message);
      }
    }
  }

  function applyChannelFilters(groupContent = "all") {
    const searchTerm =
      document.getElementById("search-input")?.value.toLowerCase() || "";
    const selectedCategory =
      document.getElementById("categoryFilter")?.value || "all";

    const filteredChannels = allChannels.filter((channel) => {
      const matchesSearch =
        (channel.name || '').toLowerCase().includes(searchTerm) ||
        (channel.keywords || []).some((k) =>
          k.toLowerCase().includes(searchTerm)
        );
      const matchesCategory =
        selectedCategory === "all" ||
        (channel.categories || [])
          .map((c) => c.toLowerCase())
          .includes(selectedCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });

    const filteredMovies = allMovies.filter((movie) => {
      const matchesSearch = movie.title.toLowerCase().includes(searchTerm);
      // Assumindo que a propriedade se chama 'genres' no seu JSON
      const matchesGenre =
        selectedCategory === "all" ||
        (movie.categories || [])
          .map((g) => g.toLowerCase())
          .includes(selectedCategory.toLowerCase());
      return matchesSearch && matchesGenre;
    });

    let combinedFiltered = [
        ...(groupContent == "all" || groupContent == "radio" ? filteredChannels : []),
        ...(groupContent == "all" || groupContent == "music" ? filteredMovies : []),
      ];

    if (groupContent == "all") {
      combinedFiltered = combinedFiltered
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
    }

    console.log('combinedFiltered', combinedFiltered);

    renderChannelGrid(combinedFiltered, groupContent);
  }

  // >>>>> NOVO: Função para filtrar os filmes <<<<<
  function applyMovieFilters() {
    const searchTerm =
      document.getElementById("movie-search-input")?.value.toLowerCase() || "";
    const selectedGenre =
      document.getElementById("movie-genre-filter")?.value || "all";

    const filtered = allMovies.filter((movie) => {
      const matchesSearch = movie.title.toLowerCase().includes(searchTerm);
      // Assumindo que a propriedade se chama 'genres' no seu JSON
      const matchesGenre =
        selectedGenre === "all" ||
        (movie.categories || [])
          .map((g) => g.toLowerCase())
          .includes(selectedGenre.toLowerCase());
      return matchesSearch && matchesGenre;
    });

    renderMovieGrid(filtered);
  }

  // =================================================================================
  // 8. LÓGICA DO MODAL
  // =================================================================================
  function openChannelModal(item) {
    modal.classList.remove("hidden");
    document.getElementById("modal-title").textContent =
      item.name || item.title;
    document.getElementById("channel-desc").innerHTML = item.description || "";
    const modalCategories = document.getElementById("modal-categories");
    modalCategories.innerHTML = ""; // Limpa antes de usar

    const categories = item.categories || item.genres || [];
    if (categories.length > 0) {
      const categoriesSpan = document.createElement("span");
      categoriesSpan.style.color = "#ec4899";
      categoriesSpan.textContent = categories.sort().join(", ");
      modalCategories.appendChild(categoriesSpan);
    }

    // const videoIframe = document.querySelector(".video-iframe");
    // videoIframe.src = item.embed || "";

    const videoContainer = document.querySelector(".video-container");
    videoContainer.innerHTML = item.embed || "";
  }

  function closeModal() {
    modal.classList.add("hidden");
    const videoIframe = document.querySelector(".video-container > iframe");
    videoIframe.src = "";
  }

  // =================================================================================
  // 9. FUNÇÕES UTILITÁRIAS (Cookies, Categorias, etc.)
  // =================================================================================

  // >>>>> MODIFICADO: Função genérica para popular categorias/gêneros <<<<<
  function populateCategories(items, selectElement, categoryKey) {
    const categories = new Set();
    items.forEach((item) => {
      // Usa a chave passada (ex: 'categories' ou 'genres') para buscar os dados
      (item[categoryKey] || []).forEach((cat) => categories.add(cat));
    });

    Array.from(categories)
      .sort()
      .forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat.toLowerCase(); // usa valor em minúsculo para consistência
        option.textContent = cat;
        selectElement.appendChild(option);
      });
  }

  function saveChannelToCookies(channelName) {
    let saved = getSavedChannelsFromCookies();
    if (!saved.includes(channelName)) {
      saved.push(channelName);
    }
    document.cookie = `savedChannels=${JSON.stringify(
      saved
    )};max-age=31536000;path=/`;
  }

  function removeChannelFromCookies(channelName) {
    let saved = getSavedChannelsFromCookies();
    saved = saved.filter((name) => name !== channelName);
    document.cookie = `savedChannels=${JSON.stringify(
      saved
    )};max-age=31536000;path=/`;
  }

  function getSavedChannelsFromCookies() {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("savedChannels="));
    if (cookie) {
      try {
        return JSON.parse(cookie.split("=")[1]);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  function isChannelSaved(channelName) {
    return savedChannels.includes(channelName);
  }

  // =================================================================================
  // 10. PONTO DE ENTRADA DA APLICAÇÃO
  // =================================================================================
  init();
});

window.addEventListener("load", function () {
  // --- Variáveis de Controle ---
  let item_timeous = []; // Guarda os timers de animação para poder limpá-los
  let previousIndex = 0; // **IMPORTANTE**: Guarda o índice do slide anterior

  // --- Funções Auxiliares ---

  // Função que aplica a classe .show item por item, criando o efeito de fade-in
  function fadeInByRows(activeSlide) {
    // Limpa timers de animações anteriores para evitar sobreposição
    item_timeous.forEach((timeout) => clearTimeout(timeout));
    item_timeous = [];

    const items = Array.from(activeSlide.querySelectorAll(".container .item"));
    const rows = {};

    items.forEach((item) => {
      const top = item.offsetTop;
      if (!rows[top]) rows[top] = [];
      rows[top].push(item);
    });

    const rowKeys = Object.keys(rows).sort((a, b) => a - b);

    rowKeys.forEach((rowTop, index) => {
      const rowItems = rows[rowTop];
      const timeout = setTimeout(() => {
        rowItems.forEach((item) => item.classList.add("show"));
      }, index * 100); // Atraso de 100ms entre cada linha
      item_timeous.push(timeout);
    });
  }

  // Função que "limpa" um slide, removendo as animações
  function cleanupSlide(slide) {
    if (slide) {
      slide.querySelectorAll(".item.show").forEach((item) => {
        item.classList.remove("show");
      });
    }
  }

  // --- Inicialização do Swiper ---
  const swiper = new Swiper(".mySwiper", {
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },

    // Eventos do Swiper
    on: {
      // Evento que roda quando o Swiper é criado
      init: function () {
        const activeSlide = this.slides[this.activeIndex];
        fadeInByRows(activeSlide);
        previousIndex = this.activeIndex;
      },

      // Evento que roda AO FINAL de uma transição de slide
      transitionEnd: function () {
        // Se não houve mudança de slide, não faz nada
        if (this.activeIndex === previousIndex) {
          return;
        }

        // 1. Limpa o slide que ficou para trás (o anterior)
        const oldSlide = this.slides[previousIndex];
        cleanupSlide(oldSlide);

        // 2. Anima o novo slide que apareceu
        const newActiveSlide = this.slides[this.activeIndex];
        fadeInByRows(newActiveSlide);

        // 3. Atualiza o índice para a próxima transição
        previousIndex = this.activeIndex;
      },
    },
  });

  const dropdownBtn = document.getElementById("dropdown-btn");
  const dropdownMenu = document.getElementById("dropdown-menu");

  // Adiciona um "escutador de evento" que reage ao clique no botão
  dropdownBtn.addEventListener("click", function (event) {
    console.log("oi");
    event.preventDefault();
    dropdownMenu.classList.toggle("show");
  });

  // Opcional, mas recomendado: Fecha o dropdown se o usuário clicar fora dele
  window.addEventListener("click", function (event) {
    // Verifica se o clique NÃO foi no botão do dropdown
    if (!dropdownBtn.contains(event.target)) {
      // Se o menu estiver aberto (contém a classe 'show'), ele a remove para fechar
      if (dropdownMenu.classList.contains("show")) {
        dropdownMenu.classList.remove("show");
      }
    }
  });
});

//
// Music Player
//

const songTitle = document.getElementById("song-title");
const songArtist = document.getElementById("song-artist");
const albumArt = document.querySelector(".album-art-bar");
const audio = document.getElementById("audio");

const prevBtn = document.getElementById("prev");
const playBtn = document.getElementById("play");
const nextBtn = document.getElementById("next");
const playBtnIcon = playBtn.querySelector("i.fas");
const mute = document.getElementById("mute");
const close = document.getElementById("close");
const player = document.getElementById("player-bar");

// Estado do Player
let currentPlaylist = [];
let currentSongIndex = 0;
let isPlaying = false;

function playRadio(channel, index) {
  player.classList.add("ativo");
  currentSongIndex = index;
  loadSong(channel);
  playSong();
}

// Carrega uma música específica no player
function loadSong(song) {
  songTitle.textContent = song.name;
  songArtist.textContent = song.description;
  audio.src = song.src;
  albumArt.src = song.logo;
}

// Funções de controle do player
function playSong() {
  isPlaying = true;
  playBtnIcon.classList.remove("fa-play");
  playBtnIcon.classList.add("fa-pause");
  audio.play();
}

function pauseSong() {
  isPlaying = false;
  playBtnIcon.classList.add("fa-play");
  playBtnIcon.classList.remove("fa-pause");
  audio.pause();
}

function prevSong() {
  currentSongIndex--;
  if (currentSongIndex < 0) {
    currentSongIndex = currentPlaylist.length - 1;
  }
  loadSong(currentPlaylist[currentSongIndex]);
  playSong();
}

function nextSong() {
  currentSongIndex++;
  if (currentSongIndex > currentPlaylist.length - 1) {
    currentSongIndex = 0;
  }
  loadSong(currentPlaylist[currentSongIndex]);
  playSong();
}

function muteSong() {
  audio.muted = !audio.muted;
  mute.classList.toggle("fa-volume-high");
  mute.classList.toggle("fa-volume-mute");
}

function closeBar() {
  player.classList.remove("ativo");
  pauseSong();
}

playBtn.addEventListener("click", () => (isPlaying ? pauseSong() : playSong()));
prevBtn.addEventListener("click", prevSong);
nextBtn.addEventListener("click", nextSong);
mute.addEventListener("click", muteSong);
close.addEventListener("click", closeBar);
