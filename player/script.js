let lastMobile = null;
function setPlayerForBreakpoint(mobile, desktop, playerSrc) {
  const isMobile = window.innerWidth < 768;
  if (lastMobile == isMobile) { return; }
  lastMobile = isMobile;

  if (isMobile) {
    mobile.src  = playerSrc;
    desktop.src = 'about:blank';
  } else {
    desktop.src = playerSrc;
    mobile.src  = 'about:blank';
  }
}

/**
   * Normalizes data from different sources (JSON, API) into a consistent format for the player.
   * @param {object} item The found media item.
   * @param {string} type The type of media ('channel', 'music', 'movie').
   * @returns {object} A standardized object.
   */
  function normalizeDataForPlayer(item, type) {
    console.log('normalizing', item, type);
    const normalized = {
      id: item.id,
      title: item.title || item.name || "Title Unavailable",
      description: item.description || "No description provided for the given media.",
      /*author: item.author || "Eternity Ready",*/
      author: "Eternity Ready",
      embedCode: item.embed || item.embedCode,
      sourceType: item.sourceType || "unknown",
      videoId: item.videoId || null,
      thumbnailUrl: item.logo 
      || (
        typeof item.thumbnail === "string"
        ? item.thumbnail
        : item?.thumbnail?.url
      )
      || null,
      origin: item.origin ?? type ?? "api",
      rating: item.rating ?? 5,
      categories: (item.categories || []).map(el => el?.name || el)
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


function timeAgo(diffMs) {
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30.44);
  const years = Math.floor(days / 365.25);

  if (years > 0) return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  if (months > 0) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  if (weeks > 0) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  return `${seconds} ${seconds === 1 ? 'second' : 'seconds'} ago`;
}

let userReactions = [];
let hasUserSubscribed = false;

async function fetchVideoFromAPI(videoTitle) {
  try {
    const url = `${API_BASE_URL}/api/video/${videoTitle}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('videoFromApi', data?.video || null);
    return data?.video || null;
  } catch (e) {
    console.error(`Failed to fetch video from API: ${e}`);
    return null;
  }
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
    
  /**
   * Fetches media data, trying local JSON files first, then falling back to the API.
   * @param {string} mediaTitle The ID of the media to fetch.
   * @returns {Promise<object|null>} The normalized media data or null.
   */
  async function fetchMediaData(mediaTitle) {
    if (!mediaTitle) return null;

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
        ...channelsData.channels.map(x => ({...x, origin: 'channels'})),
        ...musicData.music.map(x => ({...x, origin: 'music'})),
        ...moviesData.movies.map(x => ({...x, origin: 'movies'})),
      ];

      let foundItem = null;
      let itemType = "";

      foundItem = moviesData.movies.find((item) => (item.title || item.name) === mediaTitle);
      if (foundItem) itemType = "movie";

      if (!foundItem) {
        foundItem = musicData.music.find((item) => (item.title || item.name) === mediaTitle);
        if (foundItem) itemType = "music";
      }

      if (!foundItem) {
        // NOTE: Your channels.json needs an "id" field on each channel for this to work.
        foundItem = channelsData.channels.find((item) => (item.title || item.name) === mediaTitle);
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
    const apiData = await fetchVideoFromAPI(mediaTitle);
    return apiData ? normalizeDataForPlayer(apiData) : null;
  }

  /**
   * Renders the video on the page.
   * @param {object} video The video data object.
   */
  function renderVideo(video) {
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
    
    console.log('sourceType', video);

    

    if (video.sourceType === "youtube" && video.videoId) {
      playerSrc = `https://www.youtube.com/embed/${video.videoId}`;
    }

    else if (video.sourceType === "embed" && video.embedCode) {
      playerSrc = video.embedCode;
    }

    else {
      console.error("Unknown video type or missing embed URL:", video);
      return;
    }

    if (playerSrc.includes('youtube.com/embed')) {
      playerSrc += "?origin=https://eternityready.com&amp;iv_load_policy=3&amp;modestbranding=1&amp;playsinline=1&amp;showinfo=0&amp;rel=0&amp;enablejsapi=1";

      mobile.querySelector('.video-player').src = playerSrc;
      desktop.querySelector('.video-player').src = playerSrc;
      mobile.querySelector('.video-player').style.display = 'none';
      desktop.querySelector('.video-player').style.display = 'none';


      mobile.querySelector('.video-player').addEventListener('load', () => {
          new Plyr('main.mobile #video');
          mobile.querySelector('.video-player').style.top = '-50%';
          mobile.querySelector('.video-player').style.height = '200%';
          mobile.querySelector('.video-player').style.display = 'inline';
          requestAnimationFrame(() => {
            mobile.querySelector('.video-player').style.display = 'inline';
          });
      });

      desktop.querySelector('.video-player').addEventListener('load', () => {
          new Plyr('main.desktop #video');
          desktop.querySelector('.video-player').style.top = '-50%';
          desktop.querySelector('.video-player').style.height = '200%';
          requestAnimationFrame(() => {
            desktop.querySelector('.video-player').style.display = 'inline';
          });
      });
    }
    
    else {
      setPlayerForBreakpoint(mobile.querySelector('.video-player'), desktop.querySelector('.video-player'), playerSrc);
      window.addEventListener(
        'resize',
        () => setPlayerForBreakpoint(mobile.querySelector('.video-player'), desktop.querySelector('.video-player'), playerSrc)
      );
    }

    
    mobile.querySelector('.video-title').textContent = video.title;
    mobile.querySelector('.descriptionModal .video-title').textContent = video.title;
    desktop.querySelector('.video-title').textContent = video.title;

    mobile.querySelector('.profile-name').textContent = video.author || "Eternity Ready";
    mobile.querySelector('.descriptionModal .profile-name').textContent = video.author || "Eternity Ready";
    desktop.querySelector('.profile-name').textContent = video.author || "Eternity Ready";

    desktop.querySelector('.description p').innerHTML = video.description.replace(/\n/g, "<br />");
    mobile.querySelector('.descriptionModal .description p').innerHTML = video.description.replace(/\n/g, "<br />");

    fetch(`${API_BASE_URL}/api/reactions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ videoTitle: video.title }),
    })
      .then(res => res.json())
      .then(res => {
        if (res.errors) {
          console.error(res.errors)
          return;
        }

        const mobile = document.querySelector('main.mobile #like-and-dislike');
        const desktop = document.querySelector('main.desktop #like-and-dislike');
        const likeAndDislikeContainers = [mobile, desktop];

        for (const likeAndDislike of likeAndDislikeContainers) {
          const like = likeAndDislike.querySelector(".like");
          const dislike = likeAndDislike.querySelector(".dislike");

          const likeCount = like.querySelector('span:nth-child(2)');
          likeCount.textContent = parseInt(res.like);

          const dislikeCount = dislike.querySelector('span:nth-child(1)');
          dislikeCount.textContent = parseInt(res.dislike);
        }

        document.querySelector('main.mobile .descriptionModal #stats .likes').textContent = parseInt(res.like);
      });

    /*
    descriptionElement.innerHTML = video.description.replace(/\n/g, "<br />");
    */
  }

  /**
   * Initializes the player page.
   */
  async function initializePlayerPage() {
    const params = new URLSearchParams(window.location.search);
    const mediaTitle = params.get("q");
    const browserUrl = window.location.href;

    console.log('params', params);
    if (mediaTitle) {
      const mediaData = await fetchMediaData(mediaTitle);
      if (!mediaData) {
        const mobileMain = document.querySelector('main.mobile');
        const desktopMain = document.querySelector('main.desktop');
        mobileMain.style.display = 'none';
        desktopMain.style.display = 'none';
        document.getElementById("videoNotFound").style.display = 'flex';
        return;
      }

      console.log('mediaData:', mediaTitle, mediaData);

      trackMediaPlayback(mediaTitle, mediaData);

      let stored = localStorage.getItem("categoriesConsumed");
      let categoriesConsumed = stored ? JSON.parse(stored) : {};

      for (const categoryConsumed of mediaData?.categories ?? []) {
        categoriesConsumed[categoryConsumed] =
          (categoriesConsumed[categoryConsumed] ?? 0) + 1;
      }

      localStorage.setItem(
        "categoriesConsumed",
        JSON.stringify(categoriesConsumed)
      );

      renderVideo(mediaData);
      renderRecommendations(mediaData, allMedia);

      const shareModal = document.querySelector('#share-modal');

      for (const shareBtn of document.querySelectorAll('button.share')) {
        shareBtn.addEventListener('click', () => {
          const url = encodeURIComponent(shareBtn?.dataset?.shareTitle ?? mediaTitle);
          shareModal.querySelector('.videoLink input').value = `${ETERNITY_BASE_URL}/player?q=${url}`;
          shareModal.style.display = "flex";
        });
      }

      shareModal.querySelector('#share-and-close .close-share-modal').addEventListener('click', () => {
        shareModal.style.display = 'none';
      });

      shareModal.querySelector('.videoLink button').addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(browserUrl);
          console.log('Link copied to Clipboard:', browserUrl);
          addToastAndRemoveLast(
            "Success", "Link copied to Clipboard", "success"
          );
        } catch (error) {
          console.error('Failed clipboard copying URL:', browserUrl, error);
          addToastAndRemoveLast(
            "Error", error.message, "error"
          );
        }
      })      
        
      shareModal.querySelector('.platforms .platform.whatsapp').addEventListener('click', () => {
        const encodedUrl = encodeURIComponent(browserUrl);
        window.open(`https://api.whatsapp.com/send?text=${encodedUrl}`, '_blank');
      });

      shareModal.querySelector('.platforms .platform.facebook').addEventListener('click', () => {
        console.log('Share Facebook', mediaData);

        const encodedUrl = encodeURIComponent(browserUrl);
        const customTitle = encodeURIComponent(mediaData.title || '');
        const customImage = encodeURIComponent(mediaData.thumbnailUrl || '');
        const customDescription = encodeURIComponent(mediaData.description || '');

        const ogPage = `https://eternityready.com/ssr?url=${encodedUrl}&title=${customTitle}&image=${customImage}&description=${customDescription}`;
        console.log('ogPage: ', ogPage);
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(ogPage)}&quote=${customDescription}`;

        window.open(shareUrl, '_blank');
      });

      shareModal.querySelector('.platforms .platform.twitter').addEventListener('click', () => {
        const encodedUrl = encodeURIComponent(browserUrl);
        const encodedText = encodeURIComponent("Check out this Eternity Ready Video!");
        window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
      });

      shareModal.querySelector('.platforms .platform.email').addEventListener('click', () => {
        const encodedUrl = encodeURIComponent(browserUrl);
        const encodedText = encodeURIComponent("Check out this Eternity Ready Video!");
        window.open('mailto:'+'?subject='+encodedText+'&body='+encodedUrl, '_self');
      });

      const mobileSubCount = document.querySelector('.mobile .profile-subscribers');
      const desktopSubCount = document.querySelector('.desktop .profile-subscribers');

      try {
        const res = await fetch(`${API_BASE_URL}/api/subscribers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: "keystone@eternityready.com" }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw data.error;
          return;
        }

        console.log('subscribers count: ', data.subscriberCount);
        mobileSubCount.textContent = parseInt(data.subscriberCount);
        desktopSubCount.textContent = `${parseInt(data.subscriberCount)} subscribers`;

      } catch (error) {
        console.error('Error getting subscriber count');
      }

      video = null;
      try {
        const publishedVideo = await publishVideo(mediaData);
        console.log('Video published:', publishedVideo);
        
        video = await incrementVideoViews(publishedVideo.title || publishedVideo.name);
        console.log('Views incremented');
        
      } catch (publishError) {
        console.warn('Publish failed (video may already exist):');
        try {
          video = await incrementVideoViews(mediaTitle);
        } catch (viewError) {
          console.error('Views increment failed:', viewError);
        }
      }

      console.log('video', video);
      if (video) {
        const mobile = document.querySelector('.mobile');
        const desktop = document.querySelector('.desktop');
        mobile.querySelector(".views").textContent = `${video.views} Views`;
        mobile.querySelector(".descriptionModal .views").textContent = `${video.views}`;
        desktop.querySelector(".views").textContent = `${video.views} Views`;

        const date = new Date(video.createdAt);
        const day = date.getUTCDate();
        const month = date.getUTCMonth();
        const year = date.getUTCFullYear();

        const monthsMap = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        mobile.querySelector('.descriptionModal .date').textContent = `${monthsMap[month]} ${day}`;
        mobile.querySelector('.descriptionModal .date ~ span').textContent = year;

        const now = new Date(Date.now());
        mobile.querySelector('.info .date').textContent = `${timeAgo(now - date.getTime())}`
        desktop.querySelector('.description .date').textContent = `${timeAgo(now - date.getTime())}`
      }

      const user = await getUserFromSessionToken(getSession());
      hasUserSubscribed = user?.subscriptions?.some(subscription => {
        return subscription.email === 'keystone@eternityready.com'
      }) ?? false;

      const mobile = document.querySelector('main.mobile #like-and-dislike');
      const desktop = document.querySelector('main.desktop #like-and-dislike');
      const likeAndDislikeContainers = [mobile, desktop];

      if (user) {
        console.log('Fetching user reactions', mediaTitle, user.id);
        try {
          userReactions = await fetchUserReactions(mediaTitle, user.id);
        } catch (e) {
          console.error('Error fetching user reactions', e);
        }

        for (const likeAndDislike of likeAndDislikeContainers) {
          const like = likeAndDislike.querySelector(".like");
          const dislike = likeAndDislike.querySelector(".dislike");

          for (const userReaction of userReactions) {
            if (mediaTitle && userReaction.video?.title === mediaTitle) {
              if (userReaction.reaction === "like") {
                like.classList.toggle('reaction');
              }

              else {
                dislike.classList.toggle('reaction');
              }

              break;
            }
          }
        }

        for (const profileImageAddComment of document.querySelectorAll("#add-comment .profile-image img")) {
          profileImageAddComment.src = (
            user?.profileImage?.url == null
                ? `${ETERNITY_BASE_URL}/profile/public/profileImage.png`
                : `${API_BASE_URL}${user?.profileImage?.url}`
          );
        }
      }

      for (const likeAndDislike of likeAndDislikeContainers) {
        const like = likeAndDislike.querySelector(".like");
        const dislike = likeAndDislike.querySelector(".dislike");

        like.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log('Like Video', user?.id, mediaTitle);
          if (!getSession()) {
            document.getElementById('sign-in-to-continue').style.display = "flex";
            return;
          }
          addReaction(user.id, 'like', mediaTitle, null, like, dislike);
        });

        dislike.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log('Dislike Video', user?.id, mediaTitle);
          if (!getSession()) {
            document.getElementById('sign-in-to-continue').style.display = "flex";
            return;
          }
          addReaction(user.id, 'dislike', mediaTitle, null, like, dislike);
        });
      }

      for (const subscribeBtn of document.querySelectorAll('.subscribe')) {
        if (hasUserSubscribed) {
          subscribeBtn.classList.toggle('reaction');
        }

        subscribeBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          console.log('Subscribing', user);
          if (!getSession()) {
            document.getElementById('sign-in-to-continue').style.display = "flex";
            return;
          }

          if (hasUserSubscribed) {
            mobileSubCount.textContent = parseInt(mobileSubCount.textContent) - 1
            desktopSubCount.textContent = `${parseInt(desktopSubCount.textContent.split(' ')[0]) - 1} subscribers`
          }

          else {
            mobileSubCount.textContent = parseInt(mobileSubCount.textContent) + 1
            desktopSubCount.textContent = `${parseInt(desktopSubCount.textContent.split(' ')[0]) + 1} subscribers`
          }

          subscribeBtn.classList.toggle('reaction');

          hasUserSubscribed = !hasUserSubscribed;
          try {
            const response = await fetch(`${API_BASE_URL}/api/subscribe`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                subscriberEmail: user.email,
                targetUserEmail: 'keystone@eternityready.com'
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw data.error;
              return;
            }
            
            console.log('Success subscribing', user.email);

          } catch (error) {
            console.error('Failed subscribing', user.email, error);
          }
        });
      }

      for (const reportBtn of document.querySelectorAll('.report')) {
        reportBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log('Reporting video button clicked', user);
          if (!getSession()) {
            document.getElementById('sign-in-to-continue').style.display = "flex";
            return;
          }
          const mobileMain = document.querySelector('main.mobile');
          const desktopMain = document.querySelector('main.desktop');
          mobileMain.style.display = 'none';
          desktopMain.style.display = 'none';
          document.getElementById("videoNotFound").style.display = 'none';
          document.getElementById("report-video").style.display = 'flex';
        });
      }

      console.log('userReactions', userReactions);

      renderComments(user, mediaTitle);      

      document.querySelector('#report-video button:nth-child(1)').addEventListener('click', () => {
        console.log('Closing share modal');
        const mobileMain = document.querySelector('main.mobile');
        const desktopMain = document.querySelector('main.desktop');
        const isMobile = window.innerWidth < 768;
        mobileMain.hidden = !isMobile;
        desktopMain.hidden = isMobile;
        mobileMain.style.display = isMobile ? 'flex' : 'none';
        desktopMain.style.display = isMobile ? 'none' : 'flex';
        document.getElementById("videoNotFound").style.display = 'none';
        document.getElementById("report-video").style.display = 'none';
      });

      document.querySelector('#report-video button:nth-child(2)').addEventListener('click', async () => {
        const textArea = document.querySelector('#report-video textarea');
        let reason;
        for (const reasonBtn of document.getElementsByName('report-reason')) {
          if (reasonBtn.checked) {
            reason = reasonBtn;
            break;
          }
        }

        console.log('Posting share modal', textArea.value, reason?.value);
        if (!textArea.value || textArea.value === "" || !reason) {
          addToastAndRemoveLast(
            "Error", "Reason and Details fields are mandatory", "error"
          );
          return;
        }

        if (!video) { return; }

        const query = `
          mutation CreateReport($userId: ID!, $reasonId: ID!, $details: String!, $videoId: ID!) {
            createReport(
              data: {
                user: { connect: { id: $userId } }
                reason: { connect: { id: $reasonId } }
                video: { connect: { id: $videoId } }
                details: $details
              }
            ) {
              id
              details
              createdAt
              user { id email }
              reason { id name }
              video { id title }
            }
          }
        `;

        try {
          const response = await fetch(`${API_BASE_URL}/api/graphql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: query,
              variables: {
                userId: user.id,
                reasonId: reason.value,
                details: textArea.value,
                videoId: video.id
              }
            }),
          });

          const result = await response.json();
          if (result.errors) {
            throw result.errors;
          }

          console.log('Report created:', result);
          addToastAndRemoveLast(
            "Success", "Report created, our team will take a look into that.", "success"
          );
        } catch (e) {
          console.error('Failed creating report: ', e);
        }
        console.log('Closing share modal');
        const mobileMain = document.querySelector('main.mobile');
        const desktopMain = document.querySelector('main.desktop');
        const isMobile = window.innerWidth < 768;
        mobileMain.hidden = !isMobile;
        desktopMain.hidden = isMobile;
        mobileMain.style.display = isMobile ? 'flex' : 'none';
        desktopMain.style.display = isMobile ? 'none' : 'flex';
        document.getElementById("videoNotFound").style.display = 'none';
        document.getElementById("report-video").style.display = 'none';
      });

    } else {
      const mobileMain = document.querySelector('main.mobile');
      const desktopMain = document.querySelector('main.desktop');
      mobileMain.style.display = 'none';
      desktopMain.style.display = 'none';
      document.getElementById("videoNotFound").style.display = 'flex';
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
      new Map(combinedResults.map((item) => [item.mediaTitle, item])).values()
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

        const videoUrl = `/player/?q=${encodeURIComponent(video.title || video.name)}`;
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


async function publishVideo(videoData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/create-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...videoData,
        categories: videoData.categories || []
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      throw result.error;
    }

    console.log('Created categories: ', result.createdCategories, videoData);
    return result.video;
  } catch (error) {
    console.error('Error creating video:', error);
    throw error;
  }
}

async function incrementVideoViews(title) {
  const body = {title: title};

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
      <a id="video" href="${ETERNITY_BASE_URL}/player?q=${encodeURIComponent(recItem.name || recItem.title)}">
        <img
          src="${recItem.thumbnail || recItem.logo}"
        />
      </a>
      <div class="info">
        <div class="profile-image" href="${ETERNITY_BASE_URL}/player?q=${encodeURIComponent(recItem.name || recItem.title)}">
          <img
            src="${recItem.thumbnail || recItem.logo}"
          />
        </div>
        <div id="title-name-views-and-more">
          <div id="title-name-views">
            <span class="title">${recItem.title || recItem.name}</span>
            <div id="name-and-views">
              <span class="profile-name">Eternity Ready</span><span class="views">0 views</span>
            </div>
          </div>
          <div id="more-and-modal">
            <div>
              <button class="share" data-share-title="${recItem.name || recItem.title}">
                <span class="material-symbols-outlined">share</span>
                <span>Share</span>
              </button>
            </div>
            <span class="more-options material-symbols-outlined">more_vert</span>
          </div>
        </div>
      </div>
    `
    mobile.appendChild(mobileContainer);

    let desktopContainer = document.createElement("div");
    desktopContainer.className="recommendation"
    desktopContainer.innerHTML = `
      <div class="recommendation">
        <a id="video" href="${ETERNITY_BASE_URL}/player?q=${encodeURIComponent(recItem.name || recItem.title)}">
          <img
            src="${recItem.thumbnail || recItem.logo}"
          />
        </a>
        <div class="info">
          <div>
            <span class="video-title">${recItem.title || recItem.name}</span>
            <span class="profile-name">Eternity Ready</span>
            <div>
              <span class="views">0 views</span><span class="video-date">Now</span>
            </div>
          </div>
          <div id="more-and-modal">
            <div>
              <button class="share" data-share-title="${recItem.name || recItem.title}">
                <span class="material-symbols-outlined">share</span>
                <span>Share</span>
              </button>
            </div>
            <span class="more-options material-symbols-outlined">more_vert</span>
          </div>
        </div>
      </div>
    `
    desktop.appendChild(desktopContainer);

    mobileContainer.querySelector("#more-and-modal .more-options").addEventListener('click', () => {
      const divBtns = mobileContainer.querySelector("#more-and-modal > div");
      divBtns.style.display = (!divBtns.style.display || divBtns.style.display === 'none') ? 'block' : 'none';
    })

    desktopContainer.querySelector("#more-and-modal .more-options").addEventListener('click', () => {
      const divBtns = desktopContainer.querySelector("#more-and-modal > div");
      divBtns.style.display = (!divBtns.style.display || divBtns.style.display === 'none') ? 'block' : 'none';
    })

    const normalizedItem = normalizeDataForPlayer(recItem);
    console.log('Publishing recommendation Video: ', normalizedItem);
    publishVideo(normalizedItem)
      .then(async (result) => {
        console.log('Success publishing recommendation video', result);
      })
      .catch(async (error) => {
        console.log('erlsd', error);
        const isDuplicate = (
          error?.extensions?.prisma?.code === 'P2002'
          && error?.extensions?.prisma?.meta?.target?.includes('Video_title_key')
        );

        if (!isDuplicate) {
          console.error(`Unknown GraphQL Errors: ${JSON.stringify(error)}`);
        }

        console.log('Video already exists, fetching video', normalizedItem.title);
        const video = await fetchVideoFromAPI(encodeURIComponent(normalizedItem.title));
        console.log('Recommendation Fetched from API:', video);
        desktopContainer.querySelector('.views').textContent = `${video.views} views`
        mobileContainer.querySelector('.views').textContent = `${video.views} views`

        desktopContainer.querySelector('.video-date').textContent = `${timeAgo(new Date(Date.now()) - new Date(video.createdAt).getTime())}`
      });
  });
}


async function renderComments(user, videoTitle) {
  const response = await fetch(`${API_BASE_URL}/api/graphql`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query GetVideoComments($title: String!) {
          video(where: { title: $title }) {
            id
            comments(take: 100, orderBy: { timestamp: desc }) {
              id
              text
              timestamp
              user {
                id
                email
                profileImage {
                  url
                }
              }
            }
          }
        }
      `,
      variables: { title: videoTitle }
    })
  });

  const { data, errors } = await response.json();
  
  if (errors) {
    console.error('renderComment errors: ', errors);
    return;
  }

  console.log('comments: ', data?.video?.comments);


  const desktopCommentsNumber = document.querySelector(
    "#comments-number-and-sort span"
  )

  desktopCommentsNumber.textContent = `${data.video.comments.length} Comments`;
  document.getElementById("number-of-comments").textContent = data.video.comments.length;

  if (data.video.comments.length) {
    const commentMobile = document.createElement("div");
    const commentMobileImageSrc = (
      data.video.comments[0]?.user?.profileImage?.url == null
        ? `${ETERNITY_BASE_URL}/profile/public/profileImage.png`
        : `${API_BASE_URL}${data.video.comments[0].user.profileImage.url}`
    );

    commentMobile.className = "comment"
    commentMobile.innerHTML = `
      <div class="profile-image">
        <img
            src="${commentMobileImageSrc}"
        />
      </div>
      <div class="profile-text">${data.video.comments[0].text}</div>
    `
    document.querySelector('.mobile .comments').appendChild(commentMobile);
  }

  const mobile = document.querySelector('.mobile').querySelector(".commentsModal .comments");
  const desktop = document.querySelector('.desktop').querySelector(".comments");

  for (const comment of data?.video?.comments) {
    let desktopCommentContainer = document.createElement("div");
    const imageSrc = (
      comment?.user?.profileImage?.url == null
        ? `${ETERNITY_BASE_URL}/profile/public/profileImage.png`
        : `${API_BASE_URL}${comment.user.profileImage.url}`
    );

    desktopCommentContainer.className="comment"
    desktopCommentContainer.innerHTML = `
      <div class="profile-image">
        <img
            src="${imageSrc}"
        />
      </div>
      <div>
        <div id="name-and-date">
          <div class="name">${comment.user.email}</div>
          <div class="date">${timeAgo(new Date(Date.now()) - new Date(comment.timestamp).getTime())}</div>
        </div>
        <div class="text">${comment.text}</div>
        <div id="like-and-dislike">
          <button class="like">
            <span class="material-symbols-outlined">thumb_up</span>
            <span>0</span>
          </button>
          <button class="dislike">
            <span>0</span>
            <span class="material-symbols-outlined">thumb_down</span>
          </button>
        </div>
      </div>
    `

    const mobileCommentContainer = desktopCommentContainer.cloneNode(true);
    desktop.appendChild(desktopCommentContainer);
    mobile.appendChild(mobileCommentContainer);

    for (const commentContainer of [mobileCommentContainer, desktopCommentContainer]) {
      fetch(`${API_BASE_URL}/api/reactions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ commentId: comment.id }),
      })
        .then(res => res.json())
        .then((res) => {
          if (res.errors) {
            console.error(res.errors)
            return;
          }

          const like = commentContainer.querySelector(".like");
          const dislike = commentContainer.querySelector(".dislike");

          const likeCount = like.querySelector('span:nth-child(2)');
          likeCount.textContent = parseInt(res.like);

          const dislikeCount = dislike.querySelector('span:nth-child(1)');
          dislikeCount.textContent = parseInt(res.dislike);
          
          like.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Like Comment', user?.id, videoTitle, comment?.id);
            if (!getSession()) {
              document.getElementById('sign-in-to-continue').style.display = "flex";
              return;
            }
            addReaction(user.id, 'like', videoTitle, comment.id, like, dislike);
          });

          dislike.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Dislike Comment', user?.id, videoTitle, comment?.id);
            if (!getSession()) {
              document.getElementById('sign-in-to-continue').style.display = "flex";
              return;
            }
            addReaction(user.id, 'dislike', videoTitle, comment.id, like, dislike);
          });

          if (!user) { return; }

          for (const userReaction of userReactions) {
            if (comment.id && userReaction.comment?.id === comment.id) {
              if (userReaction.reaction === "like") {
                like.classList.toggle('reaction');
              }

              else {
                dislike.classList.toggle('reaction');
              }

              break;
            }
          }
      });
    }
  }
}

function addReaction(
  userId,
  reaction,
  videoTitle,
  commentId,
  like,
  dislike
) {
  let foundIdx;
  for (const idx in userReactions) {
    if (commentId && userReactions[idx].comment?.id === commentId) {
      foundIdx = idx;
      break;
    }

    if (!commentId && videoTitle && userReactions[idx].video?.title === videoTitle) {
      foundIdx = idx;
      break;
    }
  }

  const likeCount = like.querySelector('span:nth-child(2)');
  const dislikeCount = dislike.querySelector('span:nth-child(1)');

  console.log('foundIdx', foundIdx);
  if (foundIdx) {
    const found = userReactions[foundIdx];
    if (found.reaction == reaction) {
      if (reaction == "like") {
        likeCount.textContent = parseInt(likeCount.textContent) - 1
        like.classList.toggle('reaction');
      }
      else {
        dislikeCount.textContent = parseInt(dislikeCount.textContent) - 1
        dislike.classList.toggle('reaction');
      }
      userReactions.splice(foundIdx, 1);
    }

    else {
      if (found.reaction === "like" && reaction === "dislike") {
        likeCount.textContent = parseInt(likeCount.textContent) - 1
        dislikeCount.textContent = parseInt(dislikeCount.textContent) + 1
        dislike.classList.toggle('reaction');
        like.classList.toggle('reaction');
      }

      if (found.reaction === "dislike" && reaction === "like") {
        dislikeCount.textContent = parseInt(dislike.textContent) - 1
        likeCount.textContent = parseInt(likeCount.textContent) + 1
        dislike.classList.toggle('reaction');
        like.classList.toggle('reaction');
      }
      userReactions[foundIdx].reaction = reaction;
    }
  }

  else {
    if (reaction == "like") {
      likeCount.textContent = parseInt(likeCount.textContent) + 1
      like.classList.toggle('reaction');
    }
    else {
      dislikeCount.textContent = parseInt(dislikeCount.textContent) + 1;
      dislike.classList.toggle('reaction');
    }
    userReactions.push({
      reaction: reaction,
      user: { id: userId },
      video: { title: videoTitle },
      comment: { id: commentId },
    });
  }
  console.log(userReactions);

  fetch(`${API_BASE_URL}/api/react-content`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      userId: userId,
      reaction: reaction,
      videoTitle: videoTitle,
      commentId: commentId
    }),
  })
    .then(res => res.json())
    .then((res) => {
      console.log('/api/react-content', res);
    });
}
