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

// Add recommendation sliders for on-demand content
async function loadOnDemandRecommendations() {
  function waitForMedia(cb) {
    if (typeof eternityLocalData !== 'undefined' && eternityLocalData.length > 0) {
      cb(eternityLocalData);
    } else if (typeof isNormalized !== 'undefined' && isNormalized && typeof normalizedData !== 'undefined') {
      var all = [].concat(
        normalizedData.channels || [],
        normalizedData.movies || [],
        normalizedData.music || [],
        normalizedData.radio || []
      );
      cb(all);
    } else {
      setTimeout(function () { waitForMedia(cb); }, 100);
    }
  }

  waitForMedia(async function (allMedia) {
    await renderAllRecommendationSliders(
      allMedia,
      '#recommended-content-slider',
      ['on-demand']
    );
  });
}

loadOnDemandRecommendations();
