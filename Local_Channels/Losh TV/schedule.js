const params = new URLSearchParams(window.location.search);
const channel = params.get('channel') || 'default-channel';

fetch(`./${channel}/schedule.json`)
  .then(response => response.text())
  .then(text => {
    const timezoneMatch = text.match(/"timezone"\s*:\s*"([^"]+)"/);
    const randomPlaybackMatch = text.match(/"randomPlayback"\s*:\s*(true|false)/);
    const defaultMatch = text.match(/"default"\s*:\s*"([^"]+)"/);

    const timezone = timezoneMatch ? timezoneMatch[1] : "America/Toronto";
    const randomPlayback = randomPlaybackMatch ? randomPlaybackMatch[1] === "true" : false;
    const defaultVideo = defaultMatch ? defaultMatch[1] : "";

    // Parse the custom shows block
    // Each line looks like:
    // "Monday 6:00 AM to 8:00 AM" "Title: Show name" "https://example.com"
    const shows = [];
    const showRegex = /"([^"]+)"\s*"Title:\s*([^"]+)"\s*"([^"]+)"/g;
    let match;
    while ((match = showRegex.exec(text)) !== null) {
      const [_, timeRange, showName, url] = match;
      shows.push({ timeRange, showName, url });
    }

    // Helper: Convert "6:00 AM" → minutes since midnight
    const timeToMinutes = timeStr => {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier.toUpperCase() === 'PM' && hours !== 12) hours += 12;
      if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    // Helper: Get the current time and weekday in the given timezone
    const getLocalTimeData = () => {
      const now = new Date();
      const day = now.toLocaleDateString('en-US', {
        timeZone: timezone,
        weekday: 'long'
      });
      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const [hours, minutes] = timeStr.split(':').map(Number);
      return { day, currentMinutes: hours * 60 + minutes };
    };

    const getVideoURL = () => {
      let candidate = "";
      let currentShowTitle = "";

      if (randomPlayback) {
        const allVideos = shows
          .map(show => ({ title: show.showName, url: show.url, isDefault: false }))
          .concat({ title: "Default Channel Video", url: defaultVideo, isDefault: true });
        
        const randomVideo = allVideos[Math.floor(Math.random() * allVideos.length)];
        candidate = randomVideo.url;
        currentShowTitle = randomVideo.title;
        
        console.log(`Random playback: ${currentShowTitle}`);
      } else {
        const { day, currentMinutes } = getLocalTimeData();
        console.log(`Current time in ${timezone}: ${day}, ${currentMinutes} minutes since midnight.`);

        for (const s of shows) {
          const match = s.timeRange.match(/([A-Za-z]+)\s+(\d{1,2}:\d{2}\s*(?:AM|PM))\s*to\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/);
          if (!match) continue;

          const [, slotDay, startStr, endStr] = match;
          if (slotDay !== day) continue;

          const start = timeToMinutes(startStr);
          const end = timeToMinutes(endStr);

          if (currentMinutes >= start && currentMinutes <= end) {
            console.log(`Now playing: ${s.showName} (${s.timeRange})`);
            candidate = s.url;
            currentShowTitle = s.showName;
            break;
          }
        }

        if (!candidate) {
          console.log("No scheduled show is playing right now - using default video.");
          candidate = defaultVideo;
          currentShowTitle = "Default Channel Video";
        }
      }

      return candidate;
    };

    // Validate MP4 URLs via HEAD requests
    function checkMp4Video(url) {
      return fetch(url, { method: 'HEAD' }).then(response => {
        if (response.ok) return true;
        throw new Error(`MP4 video not reachable: ${url}`);
      });
    }

    // Validate YouTube videos via the oEmbed API
    function checkYouTubeVideo(url) {
      const match = url.match(/(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([^&]+)/);
      if (!match) return Promise.reject(new Error('Invalid YouTube URL'));
      const videoId = match[1];
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      return fetch(oembedUrl).then(res => {
        if (res.ok) return true;
        throw new Error(`YouTube video not available: ${url}`);
      });
    }

    function validateVideo(url) {
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        return checkYouTubeVideo(url);
      } else {
        return checkMp4Video(url);
      }
    }

    // Load a valid video, retrying if necessary
    function loadValidatedVideo() {
      const url = getVideoURL();
      return validateVideo(url)
        .then(() => url)
        .catch(err => {
          console.log("Validation failed for", url, err);
          return loadValidatedVideo();
        });
    }

    // Initialize player with the selected video
    loadValidatedVideo().then(validUrl => {
      const videoType = validUrl.includes("youtube") ? "video/youtube" : "video/mp4";
      const player = videojs('kazaa-video', {
        autoplay: true,
        techOrder: ['html5', 'youtube'],
        sources: [{ src: validUrl, type: videoType }]
      });

      player.ready(function() {
        const link = document.createElement('a');
        link.className = 'losh-logo';
        const logo = document.createElement('img');
        logo.src = `${channel}/logo.png`;
        
        function setLogoWidth() {
          logo.style.width = window.innerWidth <= 768 ? '60px' : '120px';
        }
        
        setLogoWidth();
        logo.className = 'responsive-logo';
        link.appendChild(logo);
        this.el().appendChild(link);
        
        window.addEventListener('resize', setLogoWidth);
      });

      // On end or error, load a new video (re-randomizes if needed)
      function loadNextVideo() {
        loadValidatedVideo().then(newUrl => {
          const newType = newUrl.includes("youtube") ? "video/youtube" : "video/mp4";
          player.src({ src: newUrl, type: newType });
          player.play();
        });
      }

      player.on('ended', loadNextVideo);
      player.on('error', loadNextVideo);
    })
    .catch(err => {
      console.error("Could not load a valid video:", err);
    });
  })
  .catch(err => console.error("Error fetching schedule:", err));
