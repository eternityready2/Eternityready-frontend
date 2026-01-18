const params = new URLSearchParams(window.location.search);
const channel = params.get('channel') || 'default-channel';

fetch(`${channel}/schedule.json`)
  .then(response => response.json())
  .then(scheduleData => {
    const { timezone, default: defaultVideo, shows } = scheduleData;

    // Helper: Convert "6:00 AM" → minutes since midnight
    const timeToMinutes = timeStr => {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours !== 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    // Helper: Get the current time and weekday in the provided timezone
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
      const currentMinutes = hours * 60 + minutes;
      return { day, currentMinutes };
    };

    // Determine which video should play now
    const getVideoURL = () => {
      const { day, currentMinutes } = getLocalTimeData();
      let candidate = "";

      for (const [slot, url] of Object.entries(shows)) {
        // Example slot: "Monday 6:00 AM to 8:00 AM"
        const match = slot.match(/([A-Za-z]+)\s+(\d{1,2}:\d{2}\s*(?:AM|PM))\s*to\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/);
        if (!match) continue;

        const [, slotDay, startStr, endStr] = match;
        if (slotDay !== day) continue;

        const start = timeToMinutes(startStr);
        const end = timeToMinutes(endStr);

        // If current time falls within this range, pick this video
        if (currentMinutes >= start && currentMinutes <= end) {
          candidate = url;
          break;
        }
      }

      // Fallback: play the default video if no match
      return candidate || defaultVideo;
    };

    // Check validity of MP4 videos via HEAD requests
    function checkMp4Video(url) {
      return fetch(url, { method: 'HEAD' }).then(response => {
        if (response.ok) return true;
        throw new Error(`MP4 video not reachable: ${url}`);
      });
    }

    // Check YouTube video availability
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

    // Select correct validator based on URL type
    function validateVideo(url) {
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        return checkYouTubeVideo(url);
      } else {
        return checkMp4Video(url);
      }
    }

    // Recursive loader to ensure a valid video is always chosen
    function loadValidatedVideo() {
      const url = getVideoURL();
      return validateVideo(url)
        .then(() => url)
        .catch(err => {
          console.log("Validation failed for", url, err);
          return loadValidatedVideo();
        });
    }

    // Initialize player once a valid video is found
    loadValidatedVideo().then(validUrl => {
      const videoType = validUrl.includes("youtube") ? "video/youtube" : "video/mp4";
      const player = videojs('kazaa-video', {
        autoplay: true,
        techOrder: ['html5', 'youtube'],
        sources: [{ src: validUrl, type: videoType }]
      });

      // Clone logo into the player's container
      player.ready(function() {
        const link = document.createElement('a');
        link.href = '/';
        link.className = 'video-logo';
        const logo = document.createElement('img');
        logo.src = `${channel}/logo.png`;
        logo.className = 'video-logo';
        link.appendChild(logo);
        this.el().appendChild(link);
      });

      // Reload or recover when a video ends or errors
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
