/**
 * Shared normalization, utility, and cookie functions.
 * Loaded as a global script — all functions are available on window.
 */

function createVideoCard(video) {
  if (!video) return '';
  let imageUrl, playerUrl, targetAttribute = "";
  const encodedTitle = encodeURIComponent(video.title || video.id || "");
  const id = encodeURIComponent(video.id || video.title || "");
  const thumbUrl = (video.thumbnail?.url || "").trim();

  function resolveImg(url, base) {
    if (!url) return "/images/placeholder.jpg";
    return url.startsWith("http") ? url : `${base}/${url.replace(/^\//, "")}`;
  }

  switch (video.sourceType) {
    case "radio":
      imageUrl = resolveImg(thumbUrl, API_BASE_URL);
      playerUrl = `/radio/?item=${id}`;
      break;
    case "music":
    case "channels":
    case "movies":
      imageUrl = resolveImg(thumbUrl, API_BASE_URL);
      playerUrl = `/player/?q=${encodedTitle}`;
      break;
    case "podcasts":
      imageUrl = thumbUrl.startsWith("http") ? thumbUrl : `https://keystone.eternityready.com${thumbUrl}`;
      playerUrl = `https://podcasts.eternityready.com/episodes/${video.slug}`;
      targetAttribute = 'target="_blank" rel="noopener noreferrer"';
      break;
    default:
      imageUrl = resolveImg(thumbUrl, API_BASE_URL);
      playerUrl = `/player/?q=${encodedTitle}`;
      break;
  }

  const openInNewTab = targetAttribute.includes('_blank');

  const typeLabel = video.sourceType
    ? `<div class="media-type-label">${video.sourceType.charAt(0).toUpperCase() + video.sourceType.slice(1)}</div>`
    : "";

  return `
    <div class="media-card-link" data-url="${playerUrl}" data-newtab="${openInNewTab}" style="cursor:pointer">
      <div class="media-card">
        <div class="media-thumb">
          <img src="${imageUrl}" alt="${video.title}" loading="lazy" />
          ${video.duration ? `<span class="media-duration">${video.duration}</span>` : ""}
          ${typeLabel}
        </div>
        <div class="media-info-col">
          <p class="media-title">${video.title}</p>
          <div class="media-subinfo">
            <p class="media-genre">${renderCategoryTags(video.categories)}</p>
            <p class="media-by">by <span class="media-author">${video.author || "EternityReady"}</span></p>
          </div>
        </div>
      </div>
    </div>`;
}
window.createVideoCard = createVideoCard;

// Single delegated listener for all media-card-link clicks — no inline onclick quoting issues
document.addEventListener('click', function(e) {
  const card = e.target.closest('.media-card-link');
  if (!card) return;
  if (e.target.closest('.category-tag')) return;
  const url = card.dataset.url;
  if (!url) return;
  if (card.dataset.newtab === 'true') window.open(url, '_blank');
  else window.location.href = url;
});

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
    .filter((c) => c && c.name)
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
