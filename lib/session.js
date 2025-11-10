function setSession(session) {
  localStorage.setItem('session', session);
}

function getSession() {
  return localStorage.getItem("session");
}
