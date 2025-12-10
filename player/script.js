/**
 * Returns a function that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds.
 * @param {Function} func The function to debounce.
 * @param {number} delay The number of milliseconds to delay.
 * @returns {Function} The new debounced function.
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

document.addEventListener("DOMContentLoaded", async () => {
  // =======================================================================
  // --- VIDEO PLAYER LOGIC ---
  // =======================================================================

  /**
   * Fetches a specific video from the API only. Used as a fallback.
   * @param {string} videoId The ID of the video.
   * @returns {Promise<object|null>} The video data or null.
   */

  let allMedia;
  async function fetchVideoFromAPI(videoId) {
    try {
      const url = `${API_BASE_URL}api/video/${videoId}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.video || null;
    } catch (e) {
      console.error(`Failed to fetch video from API: ${e}`);
      return null;
    }
  }

  /**
   * Normalizes data from different sources (JSON, API) into a consistent format for the player.
   * @param {object} item The found media item.
   * @param {string} type The type of media ('channel', 'music', 'movie').
   * @returns {object} A standardized object.
   */
  function normalizeDataForPlayer(item, type) {
    const normalized = {
      id: item.id,
      title: item.title || item.name || "Title Unavailable",
      description: item.description || "No description provided for the given media.",
      author: item.author || "Unknown Source", // Default if no author
      embedCode: item.embed,
      sourceType: "unknown",
      videoId: null,
      thumbnailUrl: item.logo || item.thumbnail || null,
      categories: item.categories
    };

    if (
      item.embed &&
      item.embed.includes("googleusercontent.com/youtube.com")
    ) {
      const parts = item.embed.split("/");
      normalized.videoId = parts.pop();
      normalized.sourceType = "youtube";
    } else if (item.embed) {
      normalized.sourceType = "embed";
    }
    return normalized;
  }

  /**
   * Fetches media data, trying local JSON files first, then falling back to the API.
   * @param {string} mediaId The ID of the media to fetch.
   * @returns {Promise<object|null>} The normalized media data or null.
   */
  async function fetchMediaData(mediaId) {
    if (!mediaId) return null;

    // 1. Try to fetch from local JSON files first
    try {
      const [channelsRes, musicRes, moviesRes] = await Promise.all([
        fetch("/data/channels.json"),
        fetch("/data/music.json"),
        fetch("/data/movies.json"),
      ]);

      if (!channelsRes.ok || !musicRes.ok || !moviesRes.ok) {
        throw new Error("Failed to load one or more JSON files.");
      }

      const channelsData = await channelsRes.json();
      const musicData = await musicRes.json();
      const moviesData = await moviesRes.json();

      allMedia = [
        ...channelsData.channels,
        ...musicData.music,
        ...moviesData.movies
      ];

      let foundItem = null;
      let itemType = "";

      foundItem = moviesData.movies.find((item) => item.id === mediaId);
      if (foundItem) itemType = "movie";

      if (!foundItem) {
        foundItem = musicData.music.find((item) => item.id === mediaId);
        if (foundItem) itemType = "music";
      }

      if (!foundItem) {
        // NOTE: Your channels.json needs an "id" field on each channel for this to work.
        foundItem = channelsData.channels.find((item) => item.id === mediaId);
        if (foundItem) itemType = "channel";
      }

      if (foundItem) {
        console.log(`Media found locally in ${itemType}s.json`);
        console.log('foundItem', foundItem);
        return normalizeDataForPlayer(foundItem, itemType);
      }
    } catch (e) {
      console.error("Error loading or processing local JSON files:", e);
    }

    // 2. If not found locally, fetch from the API as a fallback
    console.log("Media not found locally, trying API...");
    const apiData = await fetchVideoFromAPI(mediaId);
    return apiData ? apiData : null;
  }

  /**
   * Renders the video on the page.
   * @param {object} video The video data object.
   */
  function renderVideo(video) {
    const players = document.querySelectorAll("video-player");
    const titleElement = document.getElementById("video-title");
    const authorElement = document.getElementById("video-author");
    const descriptionElement = document.getElementById("video-description");

    /*
    if (!video || !player || !titleElement || !descriptionElement) {
      if (titleElement) titleElement.textContent = "Media not found.";
      console.error("DOM elements or media data not found.");
      return;
    }
    */


    const mobile = document.querySelector('.mobile');
    const desktop = document.querySelector('.desktop');
    let playerSrc;

    if (video.sourceType === "youtube" && video.videoId) {
      playerSrc = `https://www.youtube.com/embed/${video.videoId}?autoplay=1`;
    }

    else if (video.sourceType === "embed" && video.embedCode) {
      playerSrc = video.embedCode;
    }

    else {
      console.error("Unknown video type or missing embed URL:", video);
      return;
    }

    mobile.querySelector('.video-player').src = playerSrc;
    desktop.querySelector('.video-player').src = playerSrc;

    mobile.querySelector('.video-title').textContent = video.title;
    desktop.querySelector('.video-title').textContent = video.title;

    mobile.querySelector('.profile-name').textContent = video.author || "Unknown author";
    desktop.querySelector('.profile-name').textContent = video.author || "Unknown author";

    desktop.querySelector('.description p').innerHTML = video.description.replace(/\n/g, "<br />");

    /*
    descriptionElement.innerHTML = video.description.replace(/\n/g, "<br />");
    */
  }

  /**
   * Initializes the player page.
   */
  async function initializePlayerPage() {
    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get("q");

    console.log('params', params);
    if (mediaId) {
      const mediaData = await fetchMediaData(mediaId);
      console.log('mediaData:', mediaId, mediaData);
      renderVideo(mediaData);
      renderRecommendations(mediaData, allMedia);
      
      video = null;
      try {
        const publishedVideo = await publishVideo(mediaData);
        console.log('Video published:', publishedVideo);
        
        video = await incrementVideoViews(publishedVideo.id);
        console.log('Views incremented');
        
      } catch (publishError) {
        console.warn('Publish failed (video may already exist):', publishError.message);
        try {
          video = await incrementVideoViews(mediaData.id || mediaId);
        } catch (viewError) {
          console.error('Views increment failed:', viewError);
        }
      }

      if (video) {
        const mobile = document.querySelector('.mobile');
        const desktop = document.querySelector('.desktop');
        mobile.querySelector(".views").textContent = `${video.views} Views`;
        desktop.querySelector(".views").textContent = `${video.views} Views`;
      }

    } else {
      const titleElement = document.getElementById("video-title");
      if (titleElement) {
        titleElement.textContent = "No media selected.";
      }
    }
  }

  // =======================================================================
  // --- SEARCH BAR LOGIC ---
  // =======================================================================

  /**
   * Normalizes a local JSON item to match the structure expected by the search renderer.
   * @param {object} item - The item from a local JSON file.
   * @param {string} type - The type ('movie', 'music', 'channel').
   * @returns {object} - A standardized object for the search results list.
   */
  function normalizeLocalItemForSearch(item, type) {
    // Convert string categories to the object format the renderer expects
    const categories = (item.categories || []).map((name) => ({ name }));

    // Use 'logo' for channels and 'thumbnail' for others
    const imageUrl = type === "channel" ? item.logo : item.thumbnail;

    return {
      id: item.id,
      title: item.title || item.name,
      // The renderer expects a 'thumbnail' object with a 'url' property
      thumbnail: { url: imageUrl },
      categories: categories,
    };
  }

  /**
   * Searches for media in both local JSON files and the remote API.
   * @param {string} query The search query.
   * @returns {Promise<Array>} A combined and deduplicated list of search results.
   */
  async function searchMedia(query) {
    const lowerCaseQuery = query.toLowerCase();

    // --- Start both searches in parallel ---

    // 1. Local Search Promise
    const localSearchPromise = (async () => {
      try {
        const responses = await Promise.all([
          fetch("/data/channels.json"),
          fetch("/data/music.json"),
          fetch("/data/movies.json"),
        ]);

        const [channelsData, musicData, moviesData] = await Promise.all(
          responses.map((res) => res.json())
        );

        const allItems = [
          ...moviesData.movies.map((item) =>
            normalizeLocalItemForSearch(item, "movie")
          ),
          ...musicData.music.map((item) =>
            normalizeLocalItemForSearch(item, "music")
          ),
          ...channelsData.channels.map((item) =>
            normalizeLocalItemForSearch(item, "channel")
          ),
        ];

        return allItems.filter((item) => {
          const title = (item.title || "").toLowerCase();
          const description = (item.description || "").toLowerCase();
          const categories = (item.categories || [])
            .map((c) => c.name.toLowerCase())
            .join(" ");
          const tags = (item.tags || []).join(" ").toLowerCase();

          return (
            title.includes(lowerCaseQuery) ||
            description.includes(lowerCaseQuery) ||
            categories.includes(lowerCaseQuery) ||
            tags.includes(lowerCaseQuery)
          );
        });
      } catch (error) {
        console.error("Failed to fetch or process local search data:", error);
        return []; // Return empty array on error
      }
    })();

    // 2. API Search Promise
    const apiSearchPromise = (async () => {
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
        console.error(`Failed to fetch API search results: ${error}`);
        return []; // Return empty array on error
      }
    })();

    // --- Wait for both searches to complete and combine results ---
    const [localResults, apiResults] = await Promise.all([
      localSearchPromise,
      apiSearchPromise,
    ]);

    const combinedResults = [...localResults, ...apiResults];

    // Deduplicate results based on item ID
    const uniqueResults = Array.from(
      new Map(combinedResults.map((item) => [item.mediaId ?? item.id, item])).values()
    );

    return uniqueResults;
  }

  async function fetchCategories() {
    try {
      const url = `${API_BASE_URL}api/categories`;
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      return [];
    }
  }

  async function initializeSearch() {
    const input = document.getElementById("search-input");
    const dropdown = document.getElementById("search-dropdown");
    const mediaList = document.getElementById("media-list");
    const mediaSection = document.getElementById("media-section");
    const historySection = document.getElementById("history-section");
    const categoriesSection = document.getElementById("categories-section");
    const historyList = document.getElementById("history-list");
    const noHistory = document.getElementById("no-history");
    const categoriesList = document.getElementById("categories-list");
    const seeAllLink = document.getElementById("see-all");

    let history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    let availableCategories = [];

    function renderCategories(categoriesData) {
      if (!categoriesList) return;
      categoriesList.innerHTML = "";
      categoriesData.forEach((category) => {
        const btn = document.createElement("button");
        btn.className = "chip";
        btn.textContent = category.name;
        btn.onclick = () => {
          input.value = category.name;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        };
        categoriesList.appendChild(btn);
      });
    }

    function renderLiveResults(videos) {
      categoriesSection.style.display = "none";
      historySection.style.display = "none";
      mediaSection.style.display = "block";
      mediaList.innerHTML = "";

      if (videos.length === 0) {
        mediaList.innerHTML =
          '<li class="search-feedback">No results found.</li>';
        return;
      }

      videos.slice(0, 5).forEach((video) => {
        let imageUrl = "../player/images/placeholder.jpg"; // Default placeholder
        if (video.thumbnail && video.thumbnail.url) {
          // Check if the URL is absolute or relative
          if (video.thumbnail.url.startsWith("http")) {
            imageUrl = video.thumbnail.url; // Use absolute URL directly
          } else {
            imageUrl = `http://localhost:3002${video.thumbnail.url}`; // Prepend for relative paths (from API)
          }
        }

        const videoUrl = `/player/?q=${video.id}`;
        const li = document.createElement("li");
        li.className = "media-item";
        li.innerHTML = `
        <img src="${imageUrl}" alt="${video.title}">
        <div class="media-info">
          <p class="media-title">${video.title}</p>
          <p class="media-meta">${video.categories
            .map((c) => c.name)
            .join(", ")}</p>
        </div>`;
        li.onclick = () => {
          window.location.href = videoUrl;
        };
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
        li.innerHTML = `<a href="/search?query=${encodeURIComponent(
          term
        )}">${term}</a>`;
        li.onclick = (e) => {
          e.preventDefault();
          input.value = term;
          window.location.href = `/search?query=${encodeURIComponent(term)}`;
        };
        historyList.appendChild(li);
      });

      renderCategories(availableCategories);

      seeAllLink.textContent = "See all results »";
      seeAllLink.href = "/search";
    }

    const performLiveSearch = async (event) => {
      const query = event.target.value.trim();
      seeAllLink.href = `/search?query=${encodeURIComponent(query)}`;
      seeAllLink.textContent = `See all results for "${query}" »`;

      if (query.length < 2) {
        renderEmpty();
        return;
      }

      mediaSection.style.display = "block";
      categoriesSection.style.display = "none";
      historySection.style.display = "none";
      mediaList.innerHTML = '<li class="search-feedback">Searching...</li>';

      const results = await searchMedia(query);
      renderLiveResults(results);
    };

    availableCategories = await fetchCategories();
    const debouncedSearch = debounce(performLiveSearch, 400);

    input.addEventListener("input", debouncedSearch);
    input.addEventListener("focus", () => {
      dropdown.style.display = "block";
      if (input.value.trim() === "") renderEmpty();
      else performLiveSearch({ target: { value: input.value } });
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
      if (!document.querySelector(".search-container").contains(e.target)) {
        dropdown.style.display = "none";
      }
    });
  }

  // =======================================================================
  // --- GENERAL UI LOGIC (e.g., Mobile Menu) ---
  // =======================================================================

  function initializeGeneralUI() {
    const menuBtn = document.querySelector(".btn-menu");
    const overlay = document.querySelector(".menu-overlay");
    const mobileNav = document.querySelector(".mobile-nav");
    const closeBtn = document.querySelector(".btn-nav-close");

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
  // --- ENTRY POINT ---
  // Decides which script parts to initialize based on page elements.
  // =======================================================================

  initializePlayerPage();

  if (document.getElementById("search-input")) {
    initializeSearch();
  }

  initializeGeneralUI();
});


async function publishVideo(videoData, endpoint) {
  const query = `
    mutation CreateVideo($input: VideoCreateInput!) {
      createVideo(data: $input) {
        id
        sourceType
        youtubeUrl
        title
        description
        author
        isPublic
        featured
        highlight
        categories {
          id
          name
        }
      }
    }
  `;

  const variables = {
    input: {
      sourceType: videoData.sourceType || "youtube",
      youtubeUrl: videoData.youtubeUrl || null,
      embedCode: videoData.embedCode || null,
      title: videoData.title || null,
      description: videoData.description || null,
      author: videoData.author || null,
      isPublic: videoData.isPublic !== undefined ? videoData.isPublic : true,
      featured: videoData.featured || false,
      highlight: videoData.highlight || false,
      thumbnailUrl: videoData.thumbnailUrl || null,
      mediaId: videoData.id,

      // Auto-generated fields (leave null/undefined)
      verificationMessage: "",
      isNew: false,
      isRestricted: false
    }
  };

  console.log('variables', variables);

  try {
    const response = await fetch(`${API_BASE_URL}/api/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables })
    });

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL Errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data.createVideo;
  } catch (error) {
    console.error('Error creating video:', error);
    throw error;
  }
}

async function incrementVideoViews(id) {
  const body = {id: id};

  const response = await fetch(`${API_BASE_URL}/api/increment-views`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to increment views');
  }

  const data = await response.json();
  console.log('Views incremented:', data.video.views);
  return data.video;
}


async function renderRecommendations(currentItem, allMedia) {
  const itemCategories = currentItem.categories || currentItem.genres || [];
  if (itemCategories.length === 0) return;

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
    .slice(0, 8);

  console.log('recommendations', recommendations);
  if (recommendations.length <= 0) { return; }

  const mobile = document.querySelector('.mobile').querySelector('.recommendations');
  const desktop = document.querySelector('.desktop').querySelector('.recommendations');

  recommendations.forEach((recItem) => {
    let mobileContainer = document.createElement("div");
    mobileContainer.className="recommendation"
    mobileContainer.innerHTML = `
      <a class="video" href="${ETERNITY_BASE_URL}/player?q=${recItem.id}">
        <img
          src="${recItem.thumbnail || recItem.logo}"
        />
      </a>
      <div class="info">
        <div class="profile-image" href="${ETERNITY_BASE_URL}/player?q=${recItem.id}">
          <img
            src="${recItem.thumbnail || recItem.logo}"
          />
        </div>
        <div id="title-name-views-and-more">
          <div id="title-name-views">
            <span class="title">${recItem.title}</span>
            <div id="name-and-views">
              <span class="profile-name">Unknown Author</span><span class="views">1.3M views</span>
            </div>
          </div>
          <span class="material-symbols-outlined">more_vert</span>
        </div>
      </div>
    `
    mobile.appendChild(mobileContainer);

    let desktopContainer = document.createElement("div");
    desktopContainer.className="recommendation"
    desktopContainer.innerHTML = `
      <div class="recommendation">
        <a class="video" href="${ETERNITY_BASE_URL}/player?q=${recItem.id}">
          <img
            src="${recItem.thumbnail || recItem.logo}"
          />
        </a>
        <div class="info">
          <div>
            <span class="video-title">${recItem.title}</span>
            <span class="profile-name">Unknown Author</span>
            <div>
              <span class="views">1.3M views</span><span class="video-date">2 Years ago</span>
            </div>
          </div>
          <span class="material-symbols-outlined">more_vert</span>
        </div>
      </div>
    `
    desktop.appendChild(desktopContainer);
  });
}
