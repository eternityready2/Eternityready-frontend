const ETERNITY_TRACKING_KEY = "globalUserTracking";
const ETERNITY_LAST_PATH_KEY = "lastPath";
const ETERNITY_LAST_TITLE_KEY = "lastTitle";

function safeParseJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

function getTracking() {
  return safeParseJSON(localStorage.getItem(ETERNITY_TRACKING_KEY)) || {
    visits: {},
    sessions: {},
  };
}

function setTracking(tracking) {
  localStorage.setItem(ETERNITY_TRACKING_KEY, JSON.stringify(tracking));
}

function getOrCreateVisit(tracking, path) {
  if (!tracking.visits[path]) {
    tracking.visits[path] = {
      count: 0,
      total_time_seconds: 0,
      average_time_seconds: 0,
      timestamps: [],
      referrers: {},
    };
  }
  return tracking.visits[path];
}

function recordReferrerIfAny(visitInfo, previousPath) {
  if (previousPath && previousPath !== window.location.pathname) {
    visitInfo.referrers[previousPath] =
      (visitInfo.referrers[previousPath] ?? 0) + 1;
  }
}

function trackPageVisit() {
  const tracking = getTracking();
  const path = window.location.pathname;
  const previousPath = sessionStorage.getItem(ETERNITY_LAST_PATH_KEY);

  const visitInfo = getOrCreateVisit(tracking, path);
  visitInfo.count += 1;
  recordReferrerIfAny(visitInfo, previousPath);

  const pageVisitStart = Date.now();
  visitInfo.timestamps.push({ start: pageVisitStart });

  sessionStorage.setItem(ETERNITY_LAST_PATH_KEY, path);
  setTracking(tracking);

  window.addEventListener("beforeunload", () => {
    const now = Date.now();
    const secondsOnPage = (now - pageVisitStart) / 1000;
    const lastTs = visitInfo.timestamps[visitInfo.timestamps.length - 1];

    lastTs.end = now;
    visitInfo.total_time_seconds += secondsOnPage;
    visitInfo.average_time_seconds =
      visitInfo.total_time_seconds / visitInfo.count;

    setTracking(tracking);
  });
}

function detectDeviceType() {
  return /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
}

function getOrCreateMediaSession(tracking, mediaTitle, mediaData) {
  if (!tracking.sessions[mediaTitle]) {
    tracking.sessions[mediaTitle] = {
      origin: mediaData.origin,
      categories: mediaData.categories || [],
      total_consumption_seconds: 0,
      timestamps: [],
      metadata: {
        device: [],
        average_watch_seconds: 0,
        referrers: {},
      },
    };
  }
  return tracking.sessions[mediaTitle];
}

function recordSessionReferrer(session, previousTitle) {
  if (previousTitle && previousTitle !== session.mediaTitle) {
    const referrers = session.metadata.referrers;
    referrers[previousTitle] = (referrers[previousTitle] ?? 0) + 1;
  }
}

function trackMediaPlayback(mediaTitle, mediaData) {
  try {
    const tracking = getTracking();
    const previousTitle = sessionStorage.getItem(ETERNITY_LAST_TITLE_KEY);
    const deviceType = detectDeviceType();

    const session = getOrCreateMediaSession(tracking, mediaTitle, mediaData);
    recordSessionReferrer(session, previousTitle);

    sessionStorage.setItem(ETERNITY_LAST_TITLE_KEY, mediaTitle);

    const now = Date.now();
    session.timestamps.push({ start: now });
    session.metadata.device.push(deviceType);

    console.log("[MediaTracking] Session started:", mediaTitle, session);

    // Handle unload (similar to page tracking)
    window.addEventListener("beforeunload", () => {
      const timestamps = session.timestamps;
      const last = timestamps[timestamps.length - 1];
      last.end = Date.now();

      const sessionSeconds = (last.end - last.start) / 1000;
      session.total_consumption_seconds += sessionSeconds;

      const totalSegments = timestamps.length;
      session.metadata.average_watch_seconds =
        session.total_consumption_seconds / totalSegments;

      tracking.sessions[mediaTitle] = session;
      setTracking(tracking);
    });
  } catch (error) {
    console.error("[MediaTracking] Error:", error);
  }
}

trackPageVisit();
