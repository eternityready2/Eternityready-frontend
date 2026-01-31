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

const visits = globalUserTracking['visits'][window.location.pathname] ?? 0;
globalUserTracking['visits'][window.location.pathname] = visits + 1;

setTracking(globalUserTracking)
