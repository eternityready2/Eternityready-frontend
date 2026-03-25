/**
 * Shared slider controls and media section utilities.
 * Loaded as a global script — all functions are available on window.
 */

function initializeSliderControls(context) {
  if (!context) context = document;

  context.querySelectorAll(".slider-wrapper").forEach((wrapper) => {
    var slider;
    if (context.id === "browse-by-service") {
      slider = wrapper.querySelector(".browse-slider");
    } else if (context.id === "browse-by-people") {
      slider = wrapper.querySelector(".people-slider");
    } else {
      slider = wrapper.querySelector(".media-grid");
    }

    const prevBtn = wrapper.querySelector(".slider-arrow.prev");
    const nextBtn = wrapper.querySelector(".slider-arrow.next");

    if (!slider || !prevBtn || !nextBtn) return;

    var itemCount;
    if (context.id === "browse-by-service") {
      itemCount = slider.querySelectorAll(".service-card").length;
    } else if (context.id === "browse-by-people") {
      itemCount = slider.querySelectorAll(".person-card").length;
    } else {
      itemCount = slider.querySelectorAll(".media-card-link").length;
    }

    if (itemCount > (context.id === "browse-by-service" ? 4 : 5)) {
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

async function fetchMostViewedVideos(origin, take) {
  const hasLimit = typeof take === "number";

  const query = `
    query MostViewedVideos($origin: String!${hasLimit ? ", $take: Int" : ""}) {
      videos(
        where: { origin: { equals: $origin } }
        orderBy: { views: desc }
        ${hasLimit ? "take: $take" : ""}
      ) {
        id
        title
        views
        origin
        thumbnail {
          url
        }
        rating
      }
    }
  `;

  const variables = hasLimit ? { origin, take } : { origin };

  const res = await fetch(`${API_BASE_URL}/api/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const { data, errors } = await res.json();
  if (errors) throw new Error(errors[0].message);
  return data.videos;
}
