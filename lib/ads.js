let eternityAds = {};
let lastPlacedAd = new Date();

function sendAdStat(adId, eventType) {
  fetch(`${API_BASE_URL}/api/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        mutation {
          createAdStats(data: {
            ad: { connect: { id: "${adId}" } }
            eventType: "${eventType}"
          }) {
            id
          }
        }
      `
    })
  });
}

function placeAds() {
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
            mode
            location
            top
            left
            bottom
            right
            dimensions
            width
            height
            status
            link
            html
            image {
              id
              url
            }
          }
        }
      `
    })
  })
    .then(response => response.json())
    .then(result => {
      const shuffledAds = result.data.ads
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)

      console.log('shuffledAds', shuffledAds);
      for (let i = 0; i < shuffledAds.length; i++) {
        const ad = shuffledAds[i]

        if (ad.status === "now" || ad.status == "active") {
          if (eternityAds[ad.id] != null) { continue; }
          if (
            Math.abs(new Date() - lastPlacedAd) < 5 * 60 * 1000
            && ad.status == "active"
          ) { continue; }

          lastPlacedAd = new Date();

          let element = document.createElement("div");
          const closeBtn = document.createElement("div");

          element.id = `eternity-${ad.id}`
          element.style.position = "fixed";
          element.style.top = ad.top;
          element.style.left = ad.left;
          element.style.right = ad.right;
          element.style.bottom = ad.bottom;
          element.style.width = ad.width;
          element.style.height = ad.height;
          element.style.zIndex = 2048;

          let translateX = (ad.left != '' ? ad.left : ad.right).endsWith("%") ? '-50%' : '0';
          let translateY = (ad.top != '' ? ad.top : ad.bottom).endsWith("%") ? '-50%' : '0';
          element.style.transform = `translate(${translateX},${translateY})`;

          if (ad.mode == "imageLink") {
            const image = document.createElement("img");
            image.src = `${API_BASE_URL}/${ad.image.url}`;

            closeBtn.innerHTML = '<span class="material-icons">close</span>'

            element.className = "eternity-ad-imageLink";
            element.appendChild(image);
            element.appendChild(closeBtn);

            document.body.insertAdjacentElement("afterbegin", element);
            image.addEventListener('click', () => {
              window.open(ad.link, '_blank').focus()
              sendAdStat(ad.id, "click");
            })

            closeBtn.addEventListener('click', () => {
              element.remove();
              delete eternityAds[ad.id];
            })

          }
          else if (ad.mode == "html") {
            const parser = new DOMParser();
            const wrappedHtml = `<div>${ad.html}</div>`; 
            const doc = parser.parseFromString(wrappedHtml, 'text/html');

            document.body.appendChild(element);

            Array.from(doc.body.childNodes).forEach(node => {
              element.appendChild(node);
            });

            const scripts = element.querySelectorAll('script');

            scripts.forEach(oldScript => {
              const newScript = document.createElement('script');

              Array.from(oldScript.attributes).forEach(attr =>
                newScript.setAttribute(attr.name, attr.value)
              );

              if (oldScript.textContent) {
                newScript.textContent = oldScript.textContent;
              }
              oldScript.parentNode.replaceChild(newScript, oldScript);
            });

            element.addEventListener('click', () => {
              sendAdStat(ad.id, "click");
            })
          }
          eternityAds[ad.id] = element;
          sendAdStat(ad.id, "impression");
        }

        else if (ad.status == "disable" && eternityAds[ad.id] != null) {
          eternityAds[ad.id].remove()
        }
      }
    })
    .catch(error => {
      console.error('Error fetching ads:', error);
    });
}

placeAds();
setInterval(placeAds, 60 * 1000);
