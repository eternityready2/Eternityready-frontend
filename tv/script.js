async function fetchMostViewedChannelVideos(take = 10) {
  const query = `
    query MostViewedChannelVideos($take: Int!) {
      videos(
        where: { origin: { equals: "channels" } }
        orderBy: { views: desc }
        take: $take
      ) {
        id
        title
        views
        origin
        thumbnail {
          url
        }
      }
    }
  `;

  const res = await fetch(`${API_BASE_URL}/api/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { take },
    }),
  });

  const { data, errors } = await res.json();
  if (errors) throw new Error(errors[0].message);
  return data.videos;
}

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

async function runAfterAllMedia(allMedia, position) {
    const recommendations = await fetchRecommendation(allMedia);
    if (!recommendations || recommendations.length == 0) {
      return;
    }

    const mediaSection = document.createElement('div');
    mediaSection.className = 'media-section';
    mediaSection.innerHTML += `
    <div
      class="section-header"
    >
      <h2 class="section-title"><a href="/categories/?category=recommend">Recommended Content</a></h2><a href="/categories/?category=recommend" class="section-link"><i class="fa fa-chevron-right"></i></a></div>
  <div class="slider-wrapper">
      <button class="slider-arrow prev" aria-label="Anterior"><i class="fa fa-chevron-left"></i></button>
      <div class="media-grid">
      </div>
      <button class="slider-arrow next" aria-label="Próximo"><i class="fa fa-chevron-right"></i></button>
    </div>
    `;
    const mediaGrid = mediaSection.querySelector('.media-grid');
    for (const video of recommendations) {
      const id = encodeURIComponent(video.title || video.name);
      const videoUrl = `${ETERNITY_BASE_URL}/player/?q=${id}`;
      const imageUrl = video.thumbnail?.url?.startsWith("http")
          ? video.thumbnail.url
          : `${API_BASE_URL}/${video.thumbnail.url.replace(/^\//, "")}`;

      const mediaCardLink = document.createElement('a');
      mediaCardLink.className = "media-card-link";
      mediaCardLink.href = videoUrl;
      mediaCardLink.innerHTML += `
        <div
          class="media-card"
        >
          <div class="media-thumb">
            <img
              src="${imageUrl || "/images/placeholder.jpg"}"
              alt="${video.title}"
              loading="lazy"
              class="media-thumbnail"
            />
          </div>
          <div class="media-info-col">
            <p class="media-title">${video.title}</p>
            <div class="media-subinfo">
              <p class="media-genre">
                ${
                  (video.categories || [])
                    .map((c) => c.name)
                    .join(", ")
                }
              </p>
              <p class="media-by">
                by <span class="media-author">${video.author || "EternityReady"}</span>
              </p>
            </div>
          </div>
        </div>
      `
        mediaGrid.appendChild(mediaCardLink);
    }
    
    if (position === "channels") {
      document.querySelector('.search-section').insertAdjacentElement('afterend', mediaSection);
    }
    
    else {
      document.querySelector('#main-container').insertAdjacentElement('afterbegin', mediaSection);
    }
    initializeSliderControls(mediaSection);
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
  /*
  const dropdownBtn = document.getElementById("dropdown-btn");
  const dropdownMenu = document.getElementById("dropdown-menu");

  dropdownBtn.addEventListener("click", function (event) {
    event.preventDefault();
    dropdownMenu.classList.toggle("show");
  });

  window.addEventListener("click", function (event) {
    if (!dropdownBtn.contains(event.target)) {
      if (dropdownMenu.classList.contains("show")) {
        dropdownMenu.classList.remove("show");
      }
    }
  });

  */

  // =================================================================================
  // 1. ESTADO DA APLICAÇÃO E CACHE DE ELEMENTOS
  // =================================================================================
  // Armazena os dados carregados para evitar novas requisições
  let allChannels = [];
  let mostViewedChannels = [];
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

    savedChannels = getSavedChannelsFromCookies();

    try {
      const [channelData, movieData, mostViewedData] = await Promise.all([
        fetch("/data/channels.json").then((res) => res.json()),
        fetch("/data/movies.json").then((res) => res.json()),
        fetchMostViewedChannelVideos()
      ]);

      mostViewedChannels = mostViewedData;

      allChannels = channelData.channels.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      allMovies = movieData.movies.sort((a, b) =>
        a.title.localeCompare(b.title)
      );

      const urlParams = new URLSearchParams(window.location.search);

      /*
      const itemId = urlParams.get("id");
      if (itemId) {
        const allMedia = [...allMovies, ...allChannels];
        const itemToShow = allMedia.find(
          (item) => (item.id || item.id) === decodeURIComponent(itemId)
        );
        if (itemToShow) {
          updateView("movie");
          openChannelModal(itemToShow);
        } else {
          console.warn(`Item ID "${itemId}" not found.`);
          updateView("channel");
        }
      } else {
        updateView("channel");
      }
      */

      const viewToOpen = urlParams.get("view");
      console.log('viewTOOpen', viewToOpen);
      if (viewToOpen && viewToOpen == "movies") {
        updateView("movie");
      }

      else {
        updateView("channel");
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
    closeModalBtn?.addEventListener("click", closeModal);

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
      applyChannelFilters();
    }
  }

  // >>>>> MODIFICADO: Adicionado listener para filtros de filmes <<<<<
  function handleDynamicChange(event) {
    if (event.target.id === "categoryFilter") {
      applyChannelFilters();
    } else if (event.target.id === "movie-genre-filter") {
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
      renderChannelView();
      waitForAllMedia("channels");
      
    } else if (viewName === "movie") {
      renderMovieView();
      waitForAllMedia("movies");
    }
    
  }

  // =================================================================================
  // 5. LÓGICA DE RENDERIZAÇÃO
  // =================================================================================

  // --- RENDERIZAÇÃO DA VIEW DE CANAIS ---
  function renderChannelView() {
    const channelViewHTML = `
        <div class="search-section">
            <h2>Browse channels and Movies</h2>
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
        <div id="channel-carousels-container"></div>
        <div id="saved-channels-container"></div>
        <div class="cardbg">
            <div class="main-parent">
                <div class="count">
                    <p id="channel-count">channels</p>
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
        if (groupedChannels[tag] && groupedChannels[tag] != 'popular') groupedChannels[tag].push(channel);
      });
    });

    console.log('mostViewed', mostViewedChannels);
    groupedChannels.popular = mostViewedChannels;

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
    renderSavedChannels();
    renderSavedList();
    applyChannelFilters("channels");

    if (typeof startProgramUpdates === "function") {
      startProgramUpdates();
    }
  }

  // --- RENDERIZAÇÃO DA VIEW DE FILMES (MODIFICADA) ---
  function renderMovieView() {
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
            <div class="search-section" style="margin-top: 40px;">
                <h2>Browse channels and Movies</h2>
            <div class="channelssearch">
                <div class="second-search-parent">
                    <div class="second-search-bar">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="search-input" placeholder="Search for channels and movies..."/>
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
                        <p id="channel-count">channels</p>
                    </div>

                    <div id="channel-grid" class="channel-grid"></div>
                </div>
            </div>
        `;
    // Adiciona a nova seção ao container principal
    mainContainer.insertAdjacentHTML("beforeend", allMoviesGridHTML);

    const categoryFilterElement = document.getElementById("categoryFilter");
    // Assumindo que a propriedade se chama 'genres' no seu JSON de filmes
    populateCategories(allMovies, categoryFilterElement, "categories");
    populateCategories(allChannels, categoryFilterElement, "categories");

    applyChannelFilters("movies");
  }

  // --- FUNÇÕES DE RENDERIZAÇÃO DE GRIDS ---
  function renderChannelGrid(channelsToRender, groupContent) {
    const channelGrid = document.getElementById("channel-grid");
    channelGrid.innerHTML = "";
    channelsToRender.forEach((channel) => {
      if (channel?.name == null || !isChannelSaved(channel.name)) {
        channelGrid.appendChild(createChannelCard({
          ...channel,
          status: channel?.status ?? "ON"
        }));
      }
    });

    let channelCountText;
    if (groupContent == "all") {
      channelCountText = `Movie & Channels found: ${channelsToRender.length}`
    }

    else if (groupContent == "channels") {
      channelCountText = `Channels found: ${channelsToRender.length}`
    }
    
    else {
      channelCountText = `Movies found: ${channelsToRender.length}`
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
    ).textContent = `Movies found: ${moviesToRender.length}`;
  }

  function renderSavedChannels() {
    const savedContainer = document.getElementById("saved-channels-container");
    savedContainer.innerHTML = "";
    const savedChannelObjects = allChannels.filter((ch) =>
      isChannelSaved(ch.name)
    );

    if (savedChannelObjects.length > 0) {
      savedContainer.innerHTML = "<h2>Saved Channels</h2>";
      const savedGrid = document.createElement("div");
      savedGrid.className = "channel-grid";
      savedChannelObjects.forEach((channel) => {
        savedGrid.appendChild(createChannelCard(channel));
      });
      savedContainer.appendChild(savedGrid);
    }
  }

  // =================================================================================
  // 6. CRIAÇÃO DE ELEMENTOS (CARDS)
  // =================================================================================
  function createChannelCard(channel) {
    const card = document.createElement("div");
    card.className = "channel-card";
    //const isSaved = isChannelSaved(channel.name);
    const currentShowName = "Not Found";
    var online = "Online";
    /*
    if (channel?.status != "ON") {
      online = "Offline";
    }
    */

    let thumbnailSrc;
    if (channel.logo) {
      thumbnailSrc = channel.logo
    }

    else if (typeof channel.thumbnail === 'string') {
      thumbnailSrc = channel.thumbnail
    }
    
    else {
      thumbnailSrc = `${API_BASE_URL}/${channel.thumbnail.url.replace(/^\//, "")}`;
      channel.name = channel.title;
    }

    card.innerHTML = `
            <div class="content-banner-tv">${channel?.name == null ? "Movie" : "TV Channel"}</div>
            <img src="${thumbnailSrc}" alt="${channel.name || channel.title} loading="lazy">
            <div class="channel-details">
                <h3>${channel.name || channel.title}</h3>
                <p class="online">${online}</p>
                <div class="raiting-save">
                    <div class="rating" data-rating="${channel.rating}"></div>
                    <button class="watch-later-btn" data-channel="${
                      channel.name || channel.title
                    }">
                        <i class="fa-solid fa-bookmark bookmark-icon ${
                          "active"
                        }"></i>
                        <div class="spinner">
                            <i class="fa-solid fa-circle-notch fa-spin"></i>
                        </div>
                    </button>
                </div>
                  ${channel?.name == null
                    ? ""
                    : `<div class="current-program" data-channel-name="${channel.name.toLowerCase()}">
                         <div><span>On now:</span> Not Known</div>
                         <div><span>Up next:</span> Not Known</div>
                       </div>`
                  }
            </div>`;

    //card.addEventListener("click", () => openChannelModal(channel));
    card.addEventListener("click", () => {
      window.location.assign(`${ETERNITY_BASE_URL}/player?q=${encodeURIComponent(channel.name || channel.title)}`)
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
        <div class="content-banner-movie">Movie</div>
        <img src="${movie.thumbnail}" alt="${movie.title}" loading="lazy">
        <div class="movie-details">
            <h3>${movie.title}</h3>
            <div class="rating" data-rating="${movie.rating}"></div>
        </div>
    `;
    //card.addEventListener("click", () => openChannelModal(movie));
    console.log('movie:', movie)
    card.addEventListener("click", () => {
      window.location.assign(`${ETERNITY_BASE_URL}/player?q=${encodeURIComponent(movie.name || movie.title)}`)
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
    const isCurrentlySaved = isChannelSaved(channel.name);
    if (isCurrentlySaved) {
      removeChannelFromCookies(channel.name);
      savedChannels = savedChannels.filter((name) => name !== channel.name);
    } else {
      saveChannelToCookies(channel.name);
      savedChannels.push(channel.name);
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
    // Efficiently update both saved channels displays
    renderSavedChannels();
    renderSavedList();

    // Only update filters if needed
    if (document.getElementById("categoryFilter").value !== "all") {
      applyChannelFilters();
    }
  }
  function renderSavedList() {
    return;
    const savedListContainer = document.getElementById("savedList");
    savedListContainer.innerHTML = "";

    const savedChannelObjects = allChannels.filter((ch) =>
      isChannelSaved(ch.name)
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
        channel.name.toLowerCase().includes(searchTerm) ||
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
        ...(groupContent == "all" || groupContent == "channels" ? filteredChannels : []),
        ...(groupContent == "all" || groupContent == "movies" ? filteredMovies : []),
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
      document.getElementById("search-input")?.value.toLowerCase() || "";
    const selectedCategory =
      document.getElementById("categoryFilter")?.value || "all";

    let filtered = allMovies.filter((movie) => {
      const matchesSearch = movie.title.toLowerCase().includes(searchTerm);
      // Assumindo que a propriedade se chama 'genres' no seu JSON
      const matchesGenre =
        selectedCategory === "all" ||
        (movie.categories || [])
          .map((g) => g.toLowerCase())
          .includes(selectedCategory.toLowerCase());
      return matchesSearch && matchesGenre;
    });

    renderMovieGrid(filtered);

    filtered = allChannels.filter((channel) => {
      const matchesSearch =
        channel.name.toLowerCase().includes(searchTerm) ||
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

    renderChannelGrid(filtered);
  }

  // =================================================================================
  // 8. LÓGICA DO MODAL
  // =================================================================================
  function renderRecommendations(currentItem) {
    const recommendationsContainer = document.getElementById(
      "modal-recommendations-grid"
    );
    recommendationsContainer.innerHTML = ""; // Limpa recomendações anteriores

    const itemCategories = currentItem.categories || currentItem.genres || [];
    if (itemCategories.length === 0) return; // Não faz nada se o item não tem categoria

    // Junta canais e filmes em uma única lista para buscar recomendações
    const allMedia = [...allChannels, ...allMovies];
    const currentTitle = currentItem.name || currentItem.title;

    const recommendations = allMedia
      .filter((media) => {
        // 1. Não recomendar o próprio item que está aberto
        const mediaTitle = media.name || media.title;
        if (mediaTitle === currentTitle) {
          return false;
        }

        // 2. Verificar se há pelo menos uma categoria em comum
        const mediaCategories = media.categories || media.genres || [];
        return itemCategories.some((cat) => mediaCategories.includes(cat));
      })
      // Limita o número de recomendações (ex: 6) e embaralha para variedade
      .sort(() => 0.5 - Math.random())
      .slice(0, 6);

    if (recommendations.length > 0) {
      document.querySelector(".recommendations-section").style.display =
        "block";
      recommendations.forEach((recItem) => {
        let card;
        // Verifica se é um canal ou filme para usar a função de criação de card correta
        if (recItem.logo) {
          // Canais têm 'logo'
          card = createChannelCard(recItem);
        } else {
          // Filmes têm 'thumbnail'
          card = createMovieCard(recItem);
        }
        recommendationsContainer.appendChild(card);
      });
    } else {
      // Opcional: esconde a seção se não houver recomendações
      document.querySelector(".recommendations-section").style.display = "none";
    }
  }

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
      const categoryLabel = item.categories ? "Categories: " : "Genres: ";
      modalCategories.innerHTML = categoryLabel;
      modalCategories.appendChild(categoriesSpan);
    }

    const videoIframe = document.querySelector(".video-iframe");
    videoIframe.src = item.embed || "";

    renderRecommendations(item);
  }

  function closeModal() {
    modal.classList.add("hidden");
    const videoIframe = document.querySelector(".video-iframe");
    videoIframe.src = "";

    document.getElementById("modal-recommendations-grid").innerHTML = "";
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

  init();
});
