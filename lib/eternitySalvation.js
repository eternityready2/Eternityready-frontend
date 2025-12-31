class EternitySalvation extends HTMLElement {
  constructor() {
    super();
    let shadow = this.attachShadow({ mode: 'open' });
    this.style.display = 'none';

    fetch(`${ETERNITY_BASE_URL}/lib/eternitySalvation.html`)
      .then(response => response.text())
      .then(html => {
        shadow.innerHTML = html;
      })
      .then(() => {
        return fetch(`${ETERNITY_BASE_URL}/lib/eternitySalvation.css`);
      })
      .then((response) => response.text())
      .then(css => {
        const style = document.createElement('style');
        style.textContent = css;
        shadow.appendChild(style);
      })
      .then(() => this.style.display = 'inline')
      .catch(err => {
        console.error('Fetch error:', err);
      });
  }
}
customElements.define('eternity-salvation', EternitySalvation);
