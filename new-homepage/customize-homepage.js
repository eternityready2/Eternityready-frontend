document.addEventListener("DOMContentLoaded", function(event) {
    const body = document.querySelector('body');
    const customizeHomepage = document.getElementById("customize-homepage");
    const customizeModal = customizeHomepage.querySelector('#customize-modal');

    customizeHomepage.querySelector('button').addEventListener(
        'click', () => {
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
    );

    customizeModal.querySelector('#close-customize-modal').addEventListener(
        'click', () => {
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
    );
});
