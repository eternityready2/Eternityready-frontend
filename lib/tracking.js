const ETERNITY_TRACKING_KEY = "globalUserTracking";
const ETERNITY_LAST_PATH_KEY = "lastPath";
const ETERNITY_LAST_TITLE_KEY = "lastTitle";

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const isLocalhost =
    location.hostname === "localhost" || location.hostname === "127.0.0.1";

  const domain = isLocalhost ? "" : "; domain=.eternityready.com";
  const secure = isLocalhost ? "" : "; Secure; SameSite=None";

  document.cookie =
    `${name}=${encodeURIComponent(value)}` +
    `; expires=${expires}` +
    `; path=/` +
    domain +
    secure;
}

function getCookie(name) {
  const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
    const [key, val] = cookie.split("=");
    acc[key] = val;
    return acc;
  }, {});
  return cookies[name] ? decodeURIComponent(cookies[name]) : null;
}

function safeParseJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

function getTracking() {
  const raw = getCookie(ETERNITY_TRACKING_KEY);
  if (!raw) {
    return {
      visits: {},
      sessions: {},
    };
  }

  const decoded = decodeURIComponent(raw);
  return safeParseJSON(decoded) || {
    visits: {},
    sessions: {},
  };
}


function setTracking(tracking) {
  setCookie(ETERNITY_TRACKING_KEY, JSON.stringify(tracking), 365);
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


/* ML Algorithms */

function getAllSessions() {
  const tracking = getTracking();
  return Object.entries(tracking.sessions).map(([title, data]) => ({
    title,
    ...data,
  }));
}

function getTopItems({limit = 30, origins = []}) {
  console.log('origins', origins);
  return getAllSessions()
    .filter(session => origins.some(origin => origin === session.origin))
    .sort((a, b) => b.total_consumption_seconds - a.total_consumption_seconds)
    .slice(0, limit);
}

function getMostRecentTimestamp(session) {
  if (!session.timestamps.length) return null;
  const last = session.timestamps[session.timestamps.length - 1];
  return last.end ?? last.start;
}

function getRecentlyWatched({ limit = 30, maxAgeMs = 1000 * 60 * 60 * 24 * 7, origins = []} = {}) {
  const now = Date.now();

  return getAllSessions()
    .filter(session => origins.some(origin => origin === session.origin))
    .map(session => {
      const lastTs = getMostRecentTimestamp(session);
      return { ...session, lastActivity: lastTs };
    })
    .filter(s => s.lastActivity && (now - s.lastActivity) <= maxAgeMs)
    .sort((a, b) => {
      if (b.lastActivity !== a.lastActivity) {
        return b.lastActivity - a.lastActivity;
      }
      return b.total_consumption_seconds - a.total_consumption_seconds;
    })
    .slice(0, limit);
}

function getMostConsumedCategories({ limit = 30, origins = [] } = {}) {
  const sessions = getAllSessions();

  const filtered = sessions.filter(session => origins.some(origin => origin === session.origin))
  const categoryTotals = {};

  filtered.forEach(session => {
    const categories = session.categories || [];
    categories.forEach(category => {
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      categoryTotals[category] += session.total_consumption_seconds;
    });
  });

  return Object.entries(categoryTotals)
    .map(([category, total]) => ({
      category,
      total_consumption_seconds: total,
    }))
    .sort((a, b) => b.total_consumption_seconds - a.total_consumption_seconds)
    .slice(0, limit);
}

/* Community Engagement */

async function reportCommunityEngagement(title, origin, action) {
  try {
    await fetch(API_BASE_URL + "/api/community-engage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title, origin: origin, action: action }),
    });
  } catch (e) {
    console.error("[CommunityEngagement] Error:", e);
  }
}
