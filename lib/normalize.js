/**
 * Shared normalization, utility, and cookie functions.
 * Loaded as a global script — all functions are available on window.
 */

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

function renderCategoryTags(categories) {
  return (categories || [])
    .map((c) => `<a class="category-tag" href="/categories/?category=${encodeURIComponent(c.name)}">${c.name}</a>`)
    .join(" ");
}

function normalizeRadioItem(item) {
  const categories = Array.isArray(item.categories)
    ? item.categories.map((name) => ({ name }))
    : [];

  return {
    id: item.name,
    title: item.name,
    description: item.description || "",
    thumbnail: { url: item.logo },
    categories: categories,
    author: "EternityReady",
    duration: null,
    sourceType: "radio",
    videoId: null,
    src: item.src,
  };
}

function normalizePodcastItem(item) {
  const id = item.slug || item.id;
  let categories = [];
  if (Array.isArray(item.podcastCategories)) {
    categories = item.podcastCategories.map((cat) => ({ name: cat.name || cat }));
  } else if (typeof item.categories === "string") {
    categories = [{ name: item.categories }];
  }

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

    if (urlString) {
      const youtubeRegex =
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const match = urlString.match(youtubeRegex);

      if (match && match[1]) {
        videoId = match[1];
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
