// main pages script, excepts for vis-related elements

console.log('script.js loaded');

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Global interactions (always active)
  initGlobalInteractions();
  makeListingsClickable();
  initHeader();
});


// ——————————————————————————————————————
// Global UI interactions
function initGlobalInteractions() {
  // "Go to Insights" buttons
  document.addEventListener('click', e => {
    if (e.target.closest('.go-to-insights')) {
      e.preventDefault();
      window.location.href = '/blog/';
    }
  });

  // Animated heart on sponsor CTA
  document.addEventListener('mouseenter', e => {
    const link = e.target.closest('.donate-links a.large-cta-link');
    if (link) link.querySelector('i')?.classList.add('fa-beat');
  }, true);

  document.addEventListener('mouseleave', e => {
    const link = e.target.closest('.donate-links a.large-cta-link');
    if (link) link.querySelector('i')?.classList.remove('fa-beat');
  }, true);
}



// ——————————————————————————————————————
// Header logic: mobile menu, sponsor CTA
function initHeader() {
  const menu = document.querySelector('.menu');
  const hamburger = document.querySelector('.hamburger-menu');
  const hamburgerIcon = hamburger?.querySelector('i');
  const menuItems = document.querySelector('.menu-items');

  if (!menu || !hamburger || !menuItems) return;

  // Desktop sponsor buttons — delegation (works forever)
  document.addEventListener('click', e => {
    if (e.target.closest('.sponsor-cta')) {
      e.preventDefault();
      window.location.href = '/sponsor/';
    }
  });

  // — Mobile sponsor CTA (created once, reused forever) —
  let mobileSponsorCTA = null;

  const createMobileCTA = () => {
    if (mobileSponsorCTA) return mobileSponsorCTA;

    mobileSponsorCTA = document.createElement('button');
    mobileSponsorCTA.textContent = 'Support This Project';
    mobileSponsorCTA.className = 'primary-button sponsor-button-mobile';
    mobileSponsorCTA.style.cursor = 'pointer';

    // Use delegated click (prevents issues after DOM reload)
    mobileSponsorCTA.addEventListener('click', e => {
      e.stopPropagation();
      window.location.href = '/sponsor/';
    });

    return mobileSponsorCTA;
  };

  const isMobile = () => window.matchMedia('(max-width: 961px)').matches;

  const ensureMobileCTA = () => {
    if (isMobile()) {
      const cta = createMobileCTA();
      if (!menuItems.contains(cta)) {
        menuItems.appendChild(cta);
      }
    } else if (mobileSponsorCTA?.parentNode) {
      mobileSponsorCTA.remove();
    }
  };

  const openMenu = () => {
    menuItems.classList.add('menu-items-mobile_open');
    hamburgerIcon?.classList.replace('fa-bars', 'fa-xmark');
    ensureMobileCTA(); // Critical: show CTA when menu opens
  };

  const closeMenu = () => {
    menuItems.classList.remove('menu-items-mobile_open');
    hamburgerIcon?.classList.replace('fa-xmark', 'fa-bars');
  };

  // — Hamburger toggle —
  hamburger.addEventListener('click', e => {
    e.stopPropagation();
    menuItems.classList.contains('menu-items-mobile_open') ? closeMenu() : openMenu();
  });

  // — Close menu on outside click —
  document.addEventListener('click', e => {
    const clickedInside = menu.contains(e.target) || hamburger.contains(e.target);
    if (!clickedInside && menuItems.classList.contains('menu-items-mobile_open')) {
      closeMenu();
    }
  });

  // — Close on scroll —
  window.addEventListener('scroll', closeMenu);

  // — Responsive updates —
  window.addEventListener('resize', ensureMobileCTA);

  // — Initial state —
  ensureMobileCTA();
}

// ——————————————————————————————————————
// Make blog listing cards clickable
function makeListingsClickable() {
  document.querySelectorAll('.listing-grid li').forEach(li => {
    const link = li.querySelector('a');
    const url = link?.getAttribute('href') || li.dataset.postUrl;
    if (!url) return;

    li.style.cursor = 'pointer';
    li.tabIndex = 0;

    const navigate = () => window.location.href = url;

    li.addEventListener('click', e => {
      if (e.target.closest('a, button, .panel-cta')) return;
      navigate();
    });

    li.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate();
      }
    });
  });
}


// ——————————————————————————————————————
// References Page script
document.addEventListener('DOMContentLoaded', function () {
  // Only run on the references page
  if (!document.getElementById('references-list')) return;

  Papa.parse("https://data.weboforigins.com/references.csv", {
    download: true,
    delimiter: ";",
    header: true,
    complete: function (results) {
      const list = document.getElementById('references-list');
      // Remove any counter-reset to avoid conflict with manual numbering
      list.style.counterReset = 'none';
      list.style.listStyleType = 'none';  // disable default numbering
      list.style.paddingLeft = '0';
      list.style.maxWidth = '900px';
      list.style.margin = '0 auto';
      const loading = document.getElementById('loading-references');

      const validRows = results.data
        .filter(row => row.url)
        .sort((a, b) => (parseInt(a.id) || 99999) - (parseInt(b.id) || 99999));

      if (validRows.length === 0) {
        list.innerHTML = '<li>No references found or failed to parse data.</li>';
        list.style.display = 'block';
        loading.style.display = 'none';
        return;
      }

      validRows.forEach(row => {
        const li = document.createElement('li');
        li.style.marginBottom = '1.5rem';
        li.style.lineHeight = '1rem';
        li.style.display = 'flex';
        li.style.alignItems = 'flex-start';
        li.style.gap = '0.5rem';

        // Manual number from id
        const numSpan = document.createElement('span');
        numSpan.textContent = `${row.id}.`;
        numSpan.style.flexShrink = '0';
        numSpan.style.minWidth = '2.5em';
        numSpan.style.color = 'var(--tinted-text-color)';
        li.appendChild(numSpan);

        // Content wrapper
        const contentDiv = document.createElement('div');
        contentDiv.style.flex = '1';

        // Title (hyperlinked)
        const a = document.createElement('a');
        a.href = row.url.trim();
        a.textContent = row.title ? row.title.trim() : row.url.trim();
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.style.color = 'var(--link-color)';
        a.style.textDecoration = 'underline';
        contentDiv.appendChild(a);

        // Type (bold)
        if (row.type && row.type.trim()) {
          const typeSpan = document.createElement('strong');
          typeSpan.textContent = ` | ${row.type.trim()} `;
          typeSpan.style.fontWeight = '600';
          contentDiv.appendChild(typeSpan);
        }

        // Tags
        if (row.tags && row.tags.trim()) {
          const span = document.createElement('span');
          span.textContent = ` – ${row.tags.trim()}`;
          span.style.color = 'var(--tinted-text-color)';
          span.style.fontSize = 'var(--small-text-size)';
          span.style.fontStyle = 'italic';
          contentDiv.appendChild(span);
        }

        li.appendChild(contentDiv);
        list.appendChild(li);
      });

      loading.style.display = 'none';
      list.style.display = 'block';
    },
    error: function (err) {
      console.error("Error loading references.csv:", err);
      document.getElementById('loading-references').innerHTML =
        '<p style="color: var(--highlight-color);">Error loading references. Please try again later.</p>';
    }
  });
});