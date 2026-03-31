/**
 * Shared slider controls and media section utilities.
 * Loaded as a global script — all functions are available on window.
 */

function constructMediaSection(content, title) {
  const mediaSection = document.createElement('div');
  mediaSection.className = 'media-section';
  mediaSection.innerHTML += `
  <div class="section-header">
    <h2 class="section-title"><a href="/categories/?category=recommend">${title}</a></h2><a href="/categories/?category=recommend" class="section-link"><i class="fa fa-chevron-right"></i></a></div>
  <div class="slider-wrapper">
    <button class="slider-arrow prev" aria-label="Anterior"><i class="fa fa-chevron-left"></i></button>
    <div class="media-grid"></div>
    <button class="slider-arrow next" aria-label="Próximo"><i class="fa fa-chevron-right"></i></button>
  </div>
  `;
  const mediaGrid = mediaSection.querySelector('.media-grid');
  for (const video of content) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = window.createVideoCard(video);
    const card = wrapper.firstElementChild;
    if (card) mediaGrid.appendChild(card);
  }
  return mediaSection;
}

function initializeSliderControls(context) {
  if (!context) context = document;

  context.querySelectorAll(".slider-wrapper").forEach((wrapper) => {
    var slider;
    if (context.id === "browse-by-service") {
      slider = wrapper.querySelector(".browse-slider");
    } else if (context.id === "browse-by-people") {
      slider = wrapper.querySelector(".people-slider");
    } else {
      slider = wrapper.querySelector(".media-grid");
    }

    const prevBtn = wrapper.querySelector(".slider-arrow.prev");
    const nextBtn = wrapper.querySelector(".slider-arrow.next");

    if (!slider || !prevBtn || !nextBtn) return;

    var itemCount;
    if (context.id === "browse-by-service") {
      itemCount = slider.querySelectorAll(".service-card").length;
    } else if (context.id === "browse-by-people") {
      itemCount = slider.querySelectorAll(".person-card").length;
    } else {
      itemCount = slider.querySelectorAll(".media-card-link").length;
    }

    if (itemCount > (context.id === "browse-by-service" ? 4 : 5)) {
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

async function fetchMostViewedVideos(origin, take) {
  const hasLimit = typeof take === "number";

  const query = `
    query MostViewedVideos($origin: String!${hasLimit ? ", $take: Int" : ""}) {
      videos(
        where: { origin: { equals: $origin } }
        orderBy: { views: desc }
        ${hasLimit ? "take: $take" : ""}
      ) {
        id
        title
        views
        origin
        thumbnail {
          url
        }
        rating
      }
    }
  `;

  const variables = hasLimit ? { origin, take } : { origin };

  const res = await fetch(`${API_BASE_URL}/api/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const { data, errors } = await res.json();
  if (errors) throw new Error(errors[0].message);
  return data.videos;
}

async function fetchCommunityTopItems(origins, take) {
  try {
    var res = await fetch(
      API_BASE_URL + "/api/community-top?origins=" + origins.join(",") + "&take=" + (take || 20)
    );
    return await res.json();
  } catch (e) {
    console.error("[CommunityTop] Error:", e);
    return [];
  }
}

async function fetchCommunityTrending(origins, take, hours) {
  try {
    var res = await fetch(
      API_BASE_URL + "/api/community-trending?origins=" + origins.join(",") + "&take=" + (take || 20) + "&hours=" + (hours || 48)
    );
    return await res.json();
  } catch (e) {
    console.error("[CommunityTrending] Error:", e);
    return [];
  }
}

function blendRankings(personalItems, communityItems, allMedia) {
  var scoreMap = {};

  personalItems.forEach(function (item, i) {
    var key = item.title || item.name;
    scoreMap[key] = { personal: i, community: 999, media: item };
  });

  communityItems.forEach(function (ct, i) {
    var key = ct.title;
    var media = allMedia.find(function (m) { return (m.title || m.name) === key; });
    if (!media) return;
    if (!scoreMap[key]) {
      scoreMap[key] = { personal: 999, community: i, media: media };
    } else {
      scoreMap[key].community = i;
    }
  });

  return Object.values(scoreMap)
    .map(function (s) {
      return { media: s.media, score: s.personal * 0.6 + s.community * 0.4 };
    })
    .sort(function (a, b) { return a.score - b.score; })
    .map(function (s) { return s.media; })
    .slice(0, 20);
}

/**
 * Shared function to render ALL recommendation sliders on any page.
 * @param {Array} allMedia - all normalized media items for the page
 * @param {string} containerSelector - CSS selector for the container to insert sliders into
 * @param {Array} origins - content origins to filter by (e.g. ['channels','movies'])
 * @param {object} options - { insertMode: 'prepend'|'append', positionRef: selector for insertAdjacentElement }
 */
async function renderAllRecommendationSliders(allMedia, containerSelector, origins, options) {
  options = options || {};
  var container = document.querySelector(containerSelector);
  if (!container) return;

  var insertMode = options.insertMode || 'prepend';

  function insertSlider(section) {
    if (insertMode === 'prepend') {
      container.insertAdjacentElement('afterbegin', section);
    } else {
      container.appendChild(section);
    }
    initializeSliderControls(section);
  }

  // Collect all personal data
  var topItems = getTopItems({ origins: origins })
    .map(function (x) { return allMedia.find(function (y) { return (y.title || y.name) === x.title; }); })
    .filter(Boolean);

  var recentlyWatched = getRecentlyWatched({ origins: origins })
    .map(function (x) { return allMedia.find(function (y) { return (y.title || y.name) === x.title; }); })
    .filter(Boolean);

  var mostConsumedCategories = getMostConsumedCategories({ origins: origins });

  var watchAgain = getWatchAgain({ origins: origins })
    .map(function (x) { return allMedia.find(function (y) { return (y.title || y.name) === x.title; }); })
    .filter(Boolean);

  var quickPicks = getQuickPicks({ origins: origins })
    .map(function (x) { return allMedia.find(function (y) { return (y.title || y.name) === x.title; }); })
    .filter(Boolean);

  var becauseYouWatched = getBecauseYouWatched({ origins: origins });

  var searchRecs = getSearchBasedRecommendations(allMedia);

  // Fetch community data in parallel
  var communityTop = [];
  var communityTrending = [];
  try {
    var results = await Promise.all([
      fetchCommunityTopItems(origins, 30),
      fetchCommunityTrending(origins, 20, 48)
    ]);
    communityTop = results[0] || [];
    communityTrending = results[1] || [];
  } catch (e) {
    console.error('[RecommendationSliders] Community fetch error:', e);
  }

  // Discover New — unwatched content from user's top categories, boosted by community
  var discoverNew = getDiscoverNew(allMedia, communityTop, { origins: origins });

  // === RENDER SLIDERS (bottom-up since we prepend — last added = first visible) ===

  // 9. Based on Most Consumed Category (bottom)
  if (mostConsumedCategories && mostConsumedCategories.length > 0) {
    var topCat = mostConsumedCategories[0].category;
    var catContent = allMedia
      .filter(function (item) {
        return (item.categories || item.genres || [])
          .some(function (x) { return x === topCat || (x && x.name === topCat); });
      })
      .sort(function () { return 0.5 - Math.random(); })
      .slice(0, 15);
    if (catContent.length > 0) {
      insertSlider(constructMediaSection(catContent, 'More in "' + topCat + '"'));
    }
  }

  // 8. Discover New
  if (discoverNew && discoverNew.length > 2) {
    insertSlider(constructMediaSection(discoverNew, 'Discover New'));
  }

  // 7. Based on Your Searches
  if (searchRecs && searchRecs.length > 2) {
    insertSlider(constructMediaSection(searchRecs, 'Based on Your Searches'));
  }

  // 6. Quick Picks
  if (quickPicks && quickPicks.length > 2) {
    insertSlider(constructMediaSection(quickPicks, 'Quick Picks'));
  }

  // 5. Because You Watched [X]
  if (becauseYouWatched && becauseYouWatched.recommendations.length > 0) {
    var bywItems = becauseYouWatched.recommendations
      .map(function (x) { return allMedia.find(function (y) { return (y.title || y.name) === x.title; }); })
      .filter(Boolean);
    if (bywItems.length > 0) {
      insertSlider(constructMediaSection(bywItems, 'Because You Watched "' + becauseYouWatched.sourceTitle + '"'));
    }
  }

  // 4. Watch Again
  if (watchAgain && watchAgain.length > 0) {
    insertSlider(constructMediaSection(watchAgain, 'Watch Again'));
  }

  // 3. Recently Watched
  if (recentlyWatched && recentlyWatched.length > 0) {
    insertSlider(constructMediaSection(recentlyWatched, 'Recently Watched'));
  }

  // 2. Most Consumed
  if (topItems && topItems.length > 0) {
    insertSlider(constructMediaSection(topItems, 'Most Consumed'));
  }

  // 1. Trending Now (community — last 48 hours)
  if (communityTrending && communityTrending.length > 0) {
    var trendingItems = communityTrending
      .map(function (ct) { return allMedia.find(function (m) { return (m.title || m.name) === ct.title; }); })
      .filter(Boolean);
    if (trendingItems.length > 0) {
      insertSlider(constructMediaSection(trendingItems, 'Trending Now'));
    }
  }

  // 0. Community Picks (blended — appears at very top)
  if (communityTop && communityTop.length > 0) {
    var blended = blendRankings(topItems, communityTop, allMedia);
    if (blended.length > 0) {
      insertSlider(constructMediaSection(blended, 'Community Picks'));
    }
  }
}
