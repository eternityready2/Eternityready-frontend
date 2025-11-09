function sfToast(title, content, toastType) {
  const container = document.createElement('div');
  const toast = `
    <div class="sf-toast sf-toast-${toastType}">
      <span class="sf-toast-left material-icons">check</span>
      <section class="sf-toast-content">
        <h1>${title}</h1>
        <p>${content}</p>
      </section>
      <span class="sf-toast-right material-icons">close</span>
    </div>
  `;
  container.innerHTML = toast;
  return container.firstElementChild;
}
