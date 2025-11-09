function sfToast(title, content, toastType) {
  const toast = document.createElement('div');
  toast.className = `sf-toast sf-toast-${toastType}`;
  toast.innerHTML = `
    <span class="sf-toast-left material-icons">check</span>
    <section class="sf-toast-content">
      <h1>${title}</h1>
      <p>${content}</p>
    </section>
    <span class="sf-toast-right material-icons">close</span>
  `.trim();

  toast.addEventListener("click", function (e) {
    if (e.target.classList.contains('sf-toast-right')) {
      toast.remove();
    }
  });
  return toast;
}
