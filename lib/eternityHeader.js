const redirectToLogin = () => {
  localStorage.setItem('userPosition', window.location.href);
  window.location.assign(`${ETERNITY_BASE_URL}/login`)
};

async function fetchUser(component) {
  const sessionToken = getSession();
  const query = `
  query {
      authenticatedItem {
          ... on User {
          id
          firstName
          lastName
          email
          profileImage {
            url
          }
        }
      }
    }
  `;
  try {
    const response = await fetch(`${API_BASE_URL}/api/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ query }),
    });
    const result = await response.json();
    if (result.errors) {
      console.error('Error getting profile:', result.errors);
      addToastAndRemoveLast(
        "Error", result.errors[0].message, "error"
      );
    } else {
        const user = result.data.authenticatedItem;
        if (user) {
            console.log('hello', component);
            console.log(component.getElementById("userProfileImage"));
            component.getElementById("userProfileLink").href = `${ETERNITY_BASE_URL}/profile`;
            const imageUrl = (user?.profileImage?.url == null
                ? `${ETERNITY_BASE_URL}/profile/public/profileImage.png`
                : `${API_BASE_URL}${user?.profileImage?.url}`);
            
            component.getElementById("userProfileImage").src = imageUrl;
            component.getElementById("userDropdownImage").src = imageUrl;
            component.getElementById("userDropdownName").textContent = `${user.firstName} ${user.lastName}`
            
            const changeDropdownVisibility = () => {
              const dropdown = component.getElementById(
                "userProfileDropdown"
              );
              dropdown.style.display = (
                dropdown.style.display == "flex"
                ? "none"
                : "flex"
              );
            }
            component.getElementById("userProfileImage").removeEventListener(
              'click', redirectToLogin
            )
            component.getElementById("userProfileImage").addEventListener(
              'click', changeDropdownVisibility
            )
            component.getElementById("profileLogout").addEventListener(
              'click', () => {
                localStorage.removeItem("session");
                window.location.assign(`${ETERNITY_BASE_URL}/`);
              }
            )
        }
    }
  } catch (error) {
    console.error('Network error:', error);
    addToastAndRemoveLast(
      "Error", error.message, "error"
    );
  }
}

function setSearchExpand(component) {
  let clicked = false;
  const searchBtn = component.querySelector('#searchBtn');
  const searchContainer = component.querySelector('.search-container');
  const centeredMenu = component.querySelector('.centered_menu');
  const rightMenuButton = component.querySelector('.right .centered_menu button');
  const rightMenuFirstItem = component.querySelector('.right .centered_menu ul li:nth-child(1)');
  const logo = component.querySelector('.logo');

  function updateLogoVisibility() {
    if (clicked && window.innerWidth <= 605) {
      logo.classList.add('hide-element');
    } else {
      logo.classList.remove('hide-element');
    }
  }

  searchBtn.addEventListener('click', () => {
    if (!clicked) {
      searchContainer.classList.add('show-flex');
      centeredMenu.classList.add('hide-flex');
      centeredMenu.classList.remove('show-flex');
      rightMenuButton.classList.add('hide-element');
      rightMenuFirstItem.classList.add('hide-element');

      clicked = true;
    } else {
      searchContainer.classList.remove('show-flex');
      centeredMenu.classList.add('show-flex');
      centeredMenu.classList.remove('hide-flex');
      rightMenuButton.classList.remove('hide-element');
      rightMenuFirstItem.classList.remove('hide-element');

      clicked = false;
    }

    updateLogoVisibility();
  });

  window.addEventListener('resize', updateLogoVisibility);
}

class EternityHeader extends HTMLElement {
  constructor() {
    super();
    let shadow = this.attachShadow({ mode: 'open' });
    this.style.display = 'none';

    fetch(`${ETERNITY_BASE_URL}/lib/eternityHeader.html`)
      .then(response => response.text())
      .then(html => {
        console.log('currentUrl', window.location.pathname);

        if (window.location.pathname.startsWith("/tv") ||
            window.location.hostname === "tv.eternityready.com" ||
            window.location.hostname === "eternityready.tv")
          {
          shadow.innerHTML = html.replace(
            'eternity-header-normal-logo.png',
            'eternity-header-tv-logo.png'
          );
        }

        else {
          shadow.innerHTML = html
        }

        shadow.getElementById('burger_menu').addEventListener('click', () => {
            shadow.getElementById('side_menu').classList.toggle('open');
        });

        shadow.getElementById('side_menu_close_button').addEventListener('click', () => {
            shadow.getElementById('side_menu').classList.toggle('open');
        });

        shadow.getElementById("userProfileImage").addEventListener(
          'click', redirectToLogin
        );
        return fetch(`${ETERNITY_BASE_URL}/lib/eternityHeader.css`);
      })
      .then(response => response.text())
      .then(css => {
        const style = document.createElement('style');
        style.textContent = css;
        shadow.appendChild(style);
      })
      .then(() => fetchUser(shadow))
      .then(() => setSearchExpand(shadow))
      .then(loadAllDataSources)
      .then(normalizeAllLocalData)
      .then(() => initializeSearch(shadow))
      .then(() => this.style.display = 'inline')
      .catch(err => {
        console.error('Fetch error:', err);
      });
  }
}
customElements.define('eternity-header', EternityHeader);
