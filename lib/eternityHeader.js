
const redirectToLogin = () => window.location.assign('/login');

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
            component.getElementById("userProfileLink").href = "/profile";
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
                window.location.assign('/new-homepage');
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

class EternityHeader extends HTMLElement {
  constructor() {
    super();
    let shadow = this.attachShadow({ mode: 'open' });

    fetch(`${ETERNITY_BASE_URL}/lib/eternityHeader.html`)
      .then(response => response.text())
      .then(html => {
        console.log('currentUrl', window.location.pathname);
        if (window.location.pathname.startsWith("/tv")) {
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
      .then(loadAllDataSources)
      .then(normalizeAllLocalData)
      .then(() => initializeSearch(shadow))
      .catch(err => {
        console.error('Fetch error:', err);
      });
  }
}
customElements.define('eternity-header', EternityHeader);
