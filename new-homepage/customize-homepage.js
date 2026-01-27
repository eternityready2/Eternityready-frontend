function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(name) {
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (let c of cookies) {
    const [k, v] = c.split('=');
    if (decodeURIComponent(k) === name) return decodeURIComponent(v || '');
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

function generateIdFromTitle(title) {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
  // ensure it starts with a letter
  return base || `section-${Math.random().toString(36).slice(2, 8)}`;
}

function saveHomepageOrder() {
  const homepage = document.querySelector('#homepage-sections');
  if (!homepage) return;
  const order = Array.from(homepage.children)
    .map((node) => node.id)
    .filter(Boolean);
  try {
    setCookie('homepage_order', JSON.stringify(order), 365);
  } catch (e) {
    console.warn('Could not save homepage order to cookies:', e);
  }
}

function saveUserSections() {
  // user-created sections should be under #user-created-sections or #homepage-sections
  const container = document.querySelector('#user-created-sections') || document.querySelector('#homepage-sections');
  if (!container) return;

  const userSections = Array.from(container.children)
    .filter((el) => el.classList && el.classList.contains('media-section') && el.dataset.userCreated === 'true')
    .map((sec) => {
      const title = sec.querySelector('.section-title')?.textContent?.trim() || '';
      const id = sec.id || generateIdFromTitle(title);
      const items = Array.from(sec.querySelectorAll('.media-card-link')).map((link) => {
        const titleEl = link.querySelector('.media-title');
        const authorEl = link.querySelector('.media-author');
        const img = link.querySelector('img.media-thumbnail');
        const genreEl = link.querySelector('.media-genre');

        // Try to capture the minimum properties needed to rebuild via createMediaCard
        return {
          title: titleEl ? titleEl.textContent.trim() : '',
          author: authorEl ? authorEl.textContent.trim() : '',
          thumbnail: {
            url: img ? img.src : ''
          },
          categories: genreEl
            ? genreEl.textContent
                .split(',')
                .map((s) => ({ name: s.trim() }))
                .filter((c) => c.name)
            : []
        };
      });

      return { id, title, items };
    });

  try {
    setCookie('user_sections', JSON.stringify(userSections), 365);
  } catch (e) {
    console.warn('Could not save user sections to cookies:', e);
  }
}

function loadSavedState() {
  // Load user sections first, so they exist in DOM for ordering
  const rawUser = getCookie('user_sections');
  if (rawUser) {
    try {
      const userSections = JSON.parse(rawUser);
      if (Array.isArray(userSections)) {
        for (const sec of userSections) {
          // avoid duplicates: if there's already a section with same id, skip
          if (document.getElementById(sec.id)) continue;
          const mediaSection = buildUserSection(sec);
          // append to #user-created-sections if exists, otherwise #homepage-sections
          const target = document.querySelector('#user-created-sections') || document.querySelector('#homepage-sections');
          if (target) target.appendChild(mediaSection);
        }
      }
    } catch (e) {
      console.warn('Failed to parse user_sections cookie', e);
    }
  }

  // Then apply the saved order
  const rawOrder = getCookie('homepage_order');
  if (rawOrder) {
    try {
      const order = JSON.parse(rawOrder);
      if (Array.isArray(order) && order.length) {
        const homepage = document.querySelector('#homepage-sections');
        if (homepage) {
          for (const id of order) {
            const node = document.getElementById(id);
            if (node) homepage.appendChild(node); // moves element to end in this order
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse homepage_order cookie', e);
    }
  }

  // initialize slider controls for any newly built sections
  document.querySelectorAll('.media-section').forEach((sec) => initEternitySliderControls(sec));
}

function buildUserSection(sectionData) {
  // sectionData: { id, title, items: [{title, author, thumbnail:{url}, categories:[{name}]}] }
  const mediaSection = document.createElement('div');
  mediaSection.style.padding = '1rem 0';
  mediaSection.className = 'media-section container';
  const id = sectionData.id || generateIdFromTitle(sectionData.title);
  // ensure id is unique
  let uniqueId = id;
  let i = 1;
  while (document.getElementById(uniqueId)) {
    uniqueId = `${id}-${i++}`;
  }
  mediaSection.id = uniqueId;
  mediaSection.dataset.userCreated = 'true';

  const headerHtml = `
    <div class="section-header">
      <h2 class="section-title"><a>${sectionData.title}</a></h2>
      <a class="section-link"><i class="fa fa-chevron-right"></i></a>
    </div>
    <div class="slider-wrapper">
      <button class="slider-arrow prev" aria-label="Anterior"><i class="fa fa-chevron-left"></i></button>
      <div class="media-grid"></div>
      <button class="slider-arrow next" aria-label="Próximo"><i class="fa fa-chevron-right"></i></button>
    </div>
  `;
  mediaSection.innerHTML = headerHtml;

  const mediaGrid = mediaSection.querySelector('.media-grid');

  for (const vid of sectionData.items || []) {
    // createMediaCard expects categories to be an array of {name}
    const video = {
      title: vid.title || vid.name || '',
      name: vid.title || vid.name || '',
      author: vid.author || vid.author || '',
      thumbnail: { url: (vid.thumbnail && vid.thumbnail.url) || '' },
      categories: vid.categories || []
    };
    const link = createMediaCard(video);
    // set href to player url if ETERNITY_BASE_URL exists
    try {
      const encoded = encodeURIComponent(video.title || video.name);
      link.href = `${typeof ETERNITY_BASE_URL !== 'undefined' ? ETERNITY_BASE_URL : ''}/player/?q=${encoded}`;
    } catch (e) {}
    mediaGrid.appendChild(link);
  }

  initEternitySliderControls(mediaSection);

  return mediaSection;
}

/* ---------- existing code (mostly unchanged) ---------- */

function initEternitySliderControls(context = document) {
  context.querySelectorAll(".slider-wrapper").forEach((wrapper) => {

    let slider = wrapper.querySelector(".media-grid");

    const prevBtn = wrapper.querySelector(".slider-arrow.prev");
    const nextBtn = wrapper.querySelector(".slider-arrow.next");

    if (!slider || !prevBtn || !nextBtn) return;

    let itemCount = slider.querySelectorAll(".media-card-link").length;

    if (itemCount > 5) {
      prevBtn.style.display = "flex";
      nextBtn.style.display = "flex";
      const scrollAmount = slider.clientWidth * 0.8;
      prevBtn.addEventListener("click", () =>
        slider.scrollBy({ left: -scrollAmount, behavior: "smooth" })
      );
      nextBtn.addEventListener("click", () =>
        slider.scrollBy({ left: scrollAmount, behavior: "smooth" })
      );
    } else {
      prevBtn.style.display = "none";
      nextBtn.style.display = "none";
    }
  });

  context.querySelectorAll(".media-grid").forEach((slider) => {
    let isDown = false,
      startX,
      scrollLeft;
    const startDrag = (e) => {
      isDown = true;
      slider.classList.add("dragging");
      startX = (e.pageX || (e.touches && e.touches[0].pageX)) - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    };
    const moveDrag = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = (e.pageX || (e.touches && e.touches[0].pageX)) - slider.offsetLeft;
      const walk = (x - startX) * 1.5;
      slider.scrollLeft = scrollLeft - walk;
    };
    const endDrag = () => {
      isDown = false;
      slider.classList.remove("dragging");
    };
    slider.addEventListener("mousedown", startDrag);
    slider.addEventListener("mousemove", moveDrag);
    slider.addEventListener("mouseup", endDrag);
    slider.addEventListener("mouseleave", endDrag);
    slider.addEventListener("touchstart", startDrag, { passive: true });
    slider.addEventListener("touchmove", moveDrag, { passive: false });
    slider.addEventListener("touchend", endDrag);
  });
}

function createMediaCard(video, onClick) {
  const id = encodeURIComponent(video.title || video.name);
  const videoUrl = `${typeof ETERNITY_BASE_URL !== 'undefined' ? ETERNITY_BASE_URL : ''}/player/?q=${id}`;
  const imageUrl = video.thumbnail?.url?.trim()?.startsWith("http")
      ? video.thumbnail.url.trim()
      : `${typeof API_BASE_URL !== 'undefined' ? API_BASE_URL + '/' : ''}${(video.thumbnail?.url || '').trim().replace(/^\//, "")}`;

  const mediaCardLink = document.createElement('a');
  mediaCardLink.className = "media-card-link";
  mediaCardLink.innerHTML += `
    <div class="media-card">
      <div class="media-thumb">
        <img
          src="${imageUrl || "/images/placeholder.jpg"}"
          alt="${video.title || video.name}"
          loading="lazy"
          class="media-thumbnail"
        />
      </div>
      <div class="media-info-col">
        <p class="media-title">${video.title || video.name}</p>
        <div class="media-subinfo">
          <p class="media-genre">
            ${
              (video.categories || [])
                .map((c) => c.name)
                .join(", ")
            }
          </p>
          <p class="media-by">
            by <span class="media-author">${video.author || "EternityReady"}</span>
          </p>
        </div>
      </div>
    </div>
  `;
  // default link behavior: go to player url
  mediaCardLink.href = videoUrl;

  if (onClick) {
    mediaCardLink.addEventListener('click', (e) => {
      e.preventDefault();
      onClick(video.title || video.name);
    });
  }

  return mediaCardLink;
}

async function renderSlider(content, place, onClick, title, subtitle) {
    const mediaSection = document.createElement('div');
    mediaSection.className = 'media-section';
    mediaSection.innerHTML += `
    <div class="section-header">
      <h2 class="section-title"><a>${title}</a></h2><a class="section-link"><i class="fa fa-chevron-right"></i></a>
      <div>
        <h3 class="section-title"><a>${subtitle}</a></h3>
        </div>
    </div>
    <div class="slider-wrapper">
      <button class="slider-arrow prev" aria-label="Anterior"><i class="fa fa-chevron-left"></i></button>
      <div class="media-grid">
      </div>
      <button class="slider-arrow next" aria-label="Próximo"><i class="fa fa-chevron-right"></i></button>
    </div>
    `;
    const mediaGrid = mediaSection.querySelector('.media-grid');
    for (const video of content) {
      const mediaCardLink = createMediaCard(video, onClick ? (id) => onClick(id) : null);
      mediaGrid.appendChild(mediaCardLink);
    }

    place.appendChild(mediaSection);
    initEternitySliderControls(mediaSection);
}

document.addEventListener("DOMContentLoaded", function(event) {
    // load saved state from cookies BEFORE constructing modal UI (so reorder applies)
    loadSavedState();

    const body = document.querySelector('body');
    const customizeHomepage = document.getElementById("customize-homepage");
    const customizeModal = customizeHomepage.querySelector('#customize-modal');

    const filtersContainer = customizeModal.querySelector('.filters-container');

    let contentAdded = {};
    const openCustomizeModal = () => {
        const reorderSections = customizeModal.querySelector(
            '#reorder-sections-customize-modal'
        )
        reorderSections.innerHTML = "";
        for (const section of body.querySelector('#homepage-sections').children) {
            // only consider elements that have an id (so built-in sections are reorderable too)
            if (!section.id) continue;

            sectionTitle = section.id
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            reorderSections.insertAdjacentHTML(
                'beforeend',
                `<span
                    class="draggable"
                    draggable="true" data-section-id="${section.id}">
                    ${sectionTitle}
                </span>`
            )
        }

        // set up drag behaviour for reorderSections
        let dragged = null;

        reorderSections.addEventListener('dragstart', e => {
          const span = e.target.closest('.draggable');
          if (!span) return;

          dragged = span;
          dragged.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
        });

        reorderSections.addEventListener('dragover', e => {
          e.preventDefault();

          const span = e.target.closest('.draggable');
          if (!span || span === dragged) return;

          const rect = span.getBoundingClientRect();
          const before = (e.clientY - rect.top) < rect.height / 2;

          reorderSections.insertBefore(dragged, before ? span : span.nextSibling);
        });

        reorderSections.addEventListener('dragend', () => {
          if (dragged) {
              dragged.classList.remove('dragging');
              dragged = null;
          }
        });

        customizeModal.style.display = 'block';
        body.style.overflow = 'hidden';
        waitForEternityData()
    }

    const closeCustomizeModal = () => {
        const reorderSections = customizeModal.querySelector(
            '#reorder-sections-customize-modal'
        )

        const homepageSections = body.querySelector('#homepage-sections')

        for (const section of reorderSections.children) {
            const sectionId = section.getAttribute('data-section-id') || section.textContent.trim()
                .split(' ')
                .map(word => word.toLowerCase())
                .join('-');

            const node = document.getElementById(sectionId);
            if (node) homepageSections.insertAdjacentElement('beforeend', node)
        }

        customizeModal.style.display = 'none';
        body.style.overflow = 'scroll';

        // Remove temporary create-section previews
        for (const section of customizeModal.querySelectorAll('#create-section .media-section')) {
          section.remove();
        }
        contentAdded = {}

        // Save reorder to cookies
        saveHomepageOrder();
    }

    customizeHomepage.querySelector('button').addEventListener(
        'click', openCustomizeModal
    );

    customizeModal.querySelector('#close-customize-modal').addEventListener(
        'click', closeCustomizeModal
    );

    function renderContent(content) {
      renderSlider(
        content.slice(0, 30),
        document.querySelector('#create-section'),
        onClick = (id) => {
          const video = content.filter(x => (x.title || x.name) === id)[0];
          const mediaCardLink = createMediaCard(video);

          if (contentAdded[id] != null) {
            return;
          }

          contentAdded[id] = mediaCardLink
          if (Object.keys(contentAdded).length == 1) {
            renderSlider(
              [],
              customizeModal.querySelector(
                '#create-section #new-user-section',
              ),
              onClick = null,
              title = "New Section",
              subtitle = "Click content to remove it from your new section",

            )
          }

          customizeModal
            .querySelector('#create-section #new-user-section .media-grid')
            .appendChild(mediaCardLink)

          mediaCardLink.addEventListener('click', () => {
            delete contentAdded[id];
            mediaCardLink.remove()
            initEternitySliderControls(
              customizeModal.querySelector('#create-section #new-user-section .media-section')
            );

            if (Object.keys(contentAdded).length == 0) {
              customizeModal.querySelector(
                '#create-section #new-user-section',
              ).innerHTML = "";
            }
          })

          initEternitySliderControls(
            customizeModal.querySelector('#create-section #new-user-section .media-section')
          );
        },
        title = "Filtered Content",
        subtitle = "Click content to add it to your new section",
      )
    }

    function waitForEternityData() {
      if ( typeof eternityLocalDataLoaded !== 'undefined' && eternityLocalDataLoaded == true) {
          renderContent(eternityLocalData)
          const categoryFilter = filtersContainer.querySelector('#modal-sliders-category-filter');
          const allCategories = eternityLocalData.flatMap((content) =>
            content.categories.map((cat) => cat.name)
          );

          const uniqueCategories = [...new Set(allCategories)].sort();
          categoryFilter.innerHTML = '<option value="all">All categories</option>';
          uniqueCategories.forEach((catName) => {
            const option = document.createElement("option");
            option.value = catName;
            option.textContent = catName;
            categoryFilter.appendChild(option);
          });
      } else {
        setTimeout(() => waitForEternityData(), 50);
      }
    }

    
  document.querySelector('#create-section > button').addEventListener('click',
    () => {
      const sectionName = document.querySelector('#create-section > input').value;
      if (!sectionName || sectionName.length <= 5) {
        addToastAndRemoveLast(
          "Error", "Section Name has less than 5 characters, please fill it", "error"
        );
        return;
      }

      const newUserSectionContainer = customizeModal.querySelector('#create-section #new-user-section');
      if (!newUserSectionContainer || newUserSectionContainer.children.length == 0) {
        addToastAndRemoveLast(
          "Error", "You don't have content added, please do it.", "error"
        );
        return;
      }

      const mediaSection = customizeModal.querySelector('#create-section #new-user-section .media-section');
      mediaSection.classList.add('container')
      mediaSection.querySelector('.section-title').textContent = sectionName
      // remove subtitle wrapper used in modal
      const headerDiv = mediaSection.querySelector('.section-header div');
      if (headerDiv) headerDiv.remove();

      // ensure the section has an id and a userCreated marker
      let sectionId = generateIdFromTitle(sectionName);
      let uniqueId = sectionId;
      let i = 1;
      while (document.getElementById(uniqueId)) {
        uniqueId = `${sectionId}-${i++}`;
      }
      mediaSection.id = uniqueId;
      mediaSection.dataset.userCreated = 'true';

      // Set hrefs and clone to remove modal event listeners
      for (const mediaCardLink of mediaSection.querySelectorAll('.media-card-link')) {
        const titleText = mediaCardLink.querySelector('.media-title')?.textContent.trim();
        const id = encodeURIComponent(titleText);
        const videoUrl = `${typeof ETERNITY_BASE_URL !== 'undefined' ? ETERNITY_BASE_URL : ''}/player/?q=${id}`;
        mediaCardLink.href = videoUrl

        const freshClone = mediaCardLink.cloneNode(true);
        mediaCardLink.parentNode.replaceChild(freshClone, mediaCardLink);
      }

      // Append to '#user-created-sections' if exists, else to '#homepage-sections'
      const appendTarget = document.querySelector('#user-created-sections') || document.querySelector('#homepage-sections');
      appendTarget.appendChild(mediaSection);

      // Save user sections to cookie
      saveUserSections();

      // Also save homepage order (so newly created section stays in order)
      saveHomepageOrder();
  })
  
  function applyFilters() {
    const categoryFilter = document.querySelector('#modal-sliders-category-filter')
      .value
      ?.trim()
      ?.toLowerCase();

    const contentFilter = document.querySelector('#modal-sliders-content-filter')
      .value
      ?.trim()
      ?.toLowerCase();

    const nameFilter = document.querySelector('#modal-sliders-name-filter')
      .value
      ?.trim()
      ?.toLowerCase();

    console.log('Applying Filters', nameFilter, contentFilter, categoryFilter);

    const results = eternityLocalData.filter(
      (item) => {
        return (
          (
            (item.title || item.name).toLowerCase().includes(nameFilter) ||
            item.description.toLowerCase().includes(nameFilter)
          ) && 
          item.sourceType.toLowerCase().includes(
            !contentFilter || contentFilter == "all" ? "" : contentFilter
          ) &&
          item.categories.some((cat) =>
            cat.name.toLowerCase().includes(
              !categoryFilter || categoryFilter == "all" ? "" : categoryFilter
            )
          )
        )
      }
    )

    const mediaSection = customizeModal.querySelector(
      '#create-section > .media-section'
    );

    if (mediaSection) {
      mediaSection.remove()
    }

    renderContent(results);
  }

  document.querySelector('#modal-sliders-name-filter').addEventListener(
    'input', applyFilters
  )

  document.querySelector('#modal-sliders-category-filter').addEventListener(
    'input', applyFilters
  )

  document.querySelector('#modal-sliders-content-filter').addEventListener(
    'input', applyFilters
  )

  setInterval(() => {
    try {
      saveHomepageOrder();
      saveUserSections();
    } catch (e) {}
  }, 5000);
});
