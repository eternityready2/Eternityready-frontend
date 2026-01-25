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
      startX = (e.pageX || e.touches[0].pageX) - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    };
    const moveDrag = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = (e.pageX || e.touches[0].pageX) - slider.offsetLeft;
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
  const videoUrl = `${ETERNITY_BASE_URL}/player/?q=${id}`;
  const imageUrl = video.thumbnail?.url?.trim()?.startsWith("http")
      ? video.thumbnail.url.trim()
      : `${API_BASE_URL}/${video.thumbnail.url.trim()?.replace(/^\//, "")}`;

  const mediaCardLink = document.createElement('a');
  mediaCardLink.className = "media-card-link";
  mediaCardLink.innerHTML += `
    <div
      class="media-card"
    >
      <div class="media-thumb">
        <img
          src="${imageUrl || "/images/placeholder.jpg"}"
          alt="${video.title}"
          loading="lazy"
          class="media-thumbnail"
        />
      </div>
      <div class="media-info-col">
        <p class="media-title">${video.title}</p>
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
  `
  if (onClick) {
    mediaCardLink.addEventListener('click', () => onClick(video.title || video.name));
  }

  return mediaCardLink;
}

async function renderSlider(content, place, onClick, title, subtitle) {
    const mediaSection = document.createElement('div');
    mediaSection.className = 'media-section';
    mediaSection.style.padding = '0';
    mediaSection.innerHTML += `
    <div
      class="section-header"
    >
      <h2 class="section-title"><a>${title}</a></h2><a class="section-link"><i class="fa fa-chevron-right"></i></a>
      <div>
        <h3 class="section-title"><a >${subtitle}</a></h3>
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
      const mediaCardLink = createMediaCard(video, onClick);
      mediaGrid.appendChild(mediaCardLink);
    }
    
    place.appendChild(mediaSection);
    initEternitySliderControls(mediaSection);
}

document.addEventListener("DOMContentLoaded", function(event) {
    const body = document.querySelector('body');
    const customizeHomepage = document.getElementById("customize-homepage");
    const customizeModal = customizeHomepage.querySelector('#customize-modal');

    const filtersContainer = customizeModal.querySelector('.filters-container');

    const openCustomizeModal = () => {
        const reorderSections = customizeModal.querySelector(
            '#reorder-sections-customize-modal'
        )
        reorderSections.innerHTML = "";
        for (const section of body.querySelector('#homepage-sections').children) {
            sectionTitle = section.id
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            reorderSections.insertAdjacentHTML(
                'beforeend',
                `<span
                    class="draggable"
                    draggable="true">
                    ${sectionTitle}
                </span>`
            )
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
        }
        customizeModal.style.display = 'block';
        body.style.overflow = 'hidden';
    }

    const closeCustomizeModal = () => {
        const reorderSections = customizeModal.querySelector(
            '#reorder-sections-customize-modal'
        )

        const homepageSections = body.querySelector('#homepage-sections')

        for (const section of reorderSections.children) {
            const sectionId = section.textContent.trim()
                .split(' ')
                .map(word => word.toLowerCase())
                .join('-');
            
            const node = document.getElementById(sectionId);
            homepageSections.insertAdjacentElement('beforeend', node)
        }

        customizeModal.style.display = 'none';
        body.style.overflow = 'scroll';
    }

    customizeHomepage.querySelector('button').addEventListener(
        'click', openCustomizeModal
    );

    customizeModal.querySelector('#close-customize-modal').addEventListener(
        'click', closeCustomizeModal
    );

    openCustomizeModal()

    let contentAdded = {};
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
      if ( eternityLocalDataLoaded == true) {
          
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

    waitForEternityData()
    
  document.querySelector('#create-section > button').addEventListener('click',
    () => {
      const sectionName = document.querySelector('#create-section > input').value;
      if (!sectionName || sectionName.length <= 5) {
        addToastAndRemoveLast(
          "Error", "Section Name has less than 5 characters, please fill it", "error"
        );
        return;
      }

      if (customizeModal.querySelector('#create-section #new-user-section').children.length == 0) {
        addToastAndRemoveLast(
          "Error", "You don't have content added, please do it.", "error"
        );
        return;
      }

      const mediaSection = customizeModal.querySelector('#create-section #new-user-section .media-section');
      document.querySelector('#user-created-sections').appendChild(mediaSection)
      
      for (const mediaCardLink of mediaSection.querySelectorAll('.media-card-link')) {
        const freshClone = mediaCardLink.cloneNode(true);
        mediaCardLink.parentNode.replaceChild(freshClone, mediaCardLink);
      }
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
});
