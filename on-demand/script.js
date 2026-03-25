function constructMediaSection(content, title) {
  const mediaSection = document.createElement('div');
  mediaSection.style.paddingTop = '0';
  mediaSection.style.paddingBottom = '0';
  mediaSection.className = 'media-section';
  mediaSection.innerHTML += `
  <div
    class="section-header"
  >
    <h2 class="section-title"><a href="/categories/?category=recommend">${title}</a></h2><a href="/categories/?category=recommend" class="section-link"><i class="fa fa-chevron-right"></i></a></div>
<div class="slider-wrapper">
    <button class="slider-arrow prev" aria-label="Anterior"><i class="fa fa-chevron-left"></i></button>
    <div class="media-grid">
    </div>
    <button class="slider-arrow next" aria-label="Próximo"><i class="fa fa-chevron-right"></i></button>
  </div>
  `;
  const mediaGrid = mediaSection.querySelector('.media-grid');
  for (const video of content) {
    const id = encodeURIComponent(video.title || video.name);
    const videoUrl = video?.sourceType === "podcasts" 
      ? `https://podcasts.eternityready.com/episodes/${video.id}`
      : `${ETERNITY_BASE_URL}/player/?q=${id}`;

    const imageUrl = video.thumbnail?.url?.startsWith("http")
        ? video.thumbnail.url
        : `${video?.sourceType === "podcasts" ? "https://keystone.eternityready.com" : API_BASE_URL}/${video.thumbnail.url.replace(/^\//, "")}`;

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
  return mediaSection
}

async function fetchVideosByOrigin(origin) {
  const query = `
    query VideosBySourceType($origin: String!) {
      videos(where: { origin: { equals: $origin } }) {
        id
        title
        author
        sourceType
        youtubeUrl
        embedCode
        thumbnailUrl
        thumbnail { url }
        publishedAt
        duration
        views
        isPublic
        isNew
        featured
        highlight
        origin
        categories { name }
        onDemandBucket { name }
      }
    }
  `;

  const response = await fetch(`${API_BASE_URL}/api/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { origin }
    }),
  });

  const { data, errors } = await response.json();

  if (errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);
  }

  return data.videos;
}

async function onDemand() {
  const originVideos = await fetchVideosByOrigin('on-demand');
  console.log('originVideos', originVideos);

  const groupedByBucket = originVideos.reduce((acc, video) => {
    if (video.onDemandBucket && Array.isArray(video.onDemandBucket)) {
      video.onDemandBucket.forEach(bucket => {
        const bucketName = bucket?.name || 'Uncategorized';
        if (!acc[bucketName]) {
          acc[bucketName] = [];
        }
        acc[bucketName].push(video);
      });
    } else {
      // Fallback for videos without buckets
      const bucketName = 'Uncategorized';
      if (!acc[bucketName]) {
        acc[bucketName] = [];
      }
      acc[bucketName].push(video);
    }
    return acc;
  }, {});

  console.log('groupedByBucket', groupedByBucket);

  for (let [bucket, items] of Object.entries(groupedByBucket)) {
    const mediaSection = constructMediaSection(items, bucket)
    document.querySelector('#recommended-content-slider').insertAdjacentElement('afterbegin', mediaSection);

    initializeSliderControls(mediaSection);
  }

}

onDemand()
