function getTracking() {
  const globalUserTracking = localStorage.getItem("globalUserTracking")
  return JSON.parse(globalUserTracking)
}

function setTracking(tracking) {
  localStorage.setItem("globalUserTracking", JSON.stringify(tracking))
}

let globalUserTracking = getTracking()
if (!globalUserTracking) {
  globalUserTracking = {
    'visits': {},
    'sessions': {},
  }
}
const path = window.location.pathname;
const previousPath = sessionStorage.getItem("lastPath");

if (!globalUserTracking?.visits?.[path]) {
  globalUserTracking.visits[path] = {
    count: 0,
    total_time_seconds: 0,
    average_time_seconds: 0,
    timestamps: [],
    referrers: {},
  };
}

const visitInfo = globalUserTracking.visits[path];
visitInfo.count += 1;

if (previousPath && previousPath !== path) {
  visitInfo.referrers[previousPath] =
    (visitInfo.referrers[previousPath] ?? 0) + 1;
}

sessionStorage.setItem("lastPath", path);

const pageVisitStart = Date.now();
visitInfo.timestamps.push({ start: pageVisitStart });
setTracking(globalUserTracking);

window.addEventListener("beforeunload", () => {
  const now = Date.now();
  const secondsOnPage = (now - pageVisitStart) / 1000.0;

  const lastTs = visitInfo.timestamps[visitInfo.timestamps.length - 1];
  lastTs.end = now;

  visitInfo.total_time_seconds += secondsOnPage;

  visitInfo.average_time_seconds =
    visitInfo.total_time_seconds / visitInfo.count;

  setTracking(globalUserTracking);
});
