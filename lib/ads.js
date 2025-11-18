document.addEventListener("DOMContentLoaded", () => {
  fetch(`${API_BASE_URL}/api/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `
        query {
          ads {
            id
            title
            location
            image {
              id
              url
            }
            link
            isActive
          }
        }
      `
    })
  })
    .then(response => response.json())
    .then(result => {
      console.log('ads', result.data.ads);
      const sidebar = document.getElementById("eternity-ad-sidebar");
      const footer = document.getElementById("eternity-ad-footer");
      const header = document.getElementById("eternity-ad-header");

      for (let i = 0; i < result.data.ads.length; i++) {
        const ad = result.data.ads[i]
        if (ad.isActive) {
          let element;
          let src;
          if (ad.location == "footer") {
            src = `${API_BASE_URL}${ad.image.url}`;
            element = footer
          }

          else if (ad.location == "sidebar") {
            src = `${API_BASE_URL}${ad.image.url}`;
            element = sidebar
          }
          
          else if (ad.location == "header") {
            src = `${API_BASE_URL}${ad.image.url}`;
            element = header
          }

          if (!element) {
            continue
          }

          const image = document.createElement("img");
          const closeBtn = document.createElement("div");
          closeBtn.innerHTML = '<span class="material-icons">close</span>'

          image.src = src;
          image.addEventListener('click', () => {
            window.open(ad.link, '_blank').focus()
          })

          closeBtn.addEventListener('click', () => {
            element.remove();
          })

          element.innerHTML = '';
          element.appendChild(image);
          element.appendChild(closeBtn);
        }
      }
    })
    .catch(error => {
      console.error('Error fetching ads:', error);
    });
})
