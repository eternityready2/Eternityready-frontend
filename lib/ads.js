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
      console.log('ads', result);

      for (let i = 0; i < result.data.ads.length; i++) {
        const ad = result.data.ads[i]

        if (ad.status === "now") {
          let element = document.createElement("div");
          const closeBtn = document.createElement("div");

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
            })

            closeBtn.addEventListener('click', () => {
              element.remove();
            })

          }
          else if (ad.mode == "html") {
            
            const parser = new DOMParser();
            const wrappedHtml = `<div>${ad.html}</div>`; 
            const doc = parser.parseFromString(wrappedHtml, 'text/html');

            const container = document.createElement('div');
            document.body.appendChild(container);

            Array.from(doc.body.childNodes).forEach(node => {
              container.appendChild(node);
            });

            const scripts = container.querySelectorAll('script');

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
          }
        }
      }
    })
    .catch(error => {
      console.error('Error fetching ads:', error);
    });
})
