// main pages script, excepts for vis-related elements

console.log('script.js loaded');

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Global interactions (always active)
  initGlobalInteractions();
  makeListingsClickable();
  initHeader();
  initAIMode();
  // initThemeToggle();
});


// ——————————————————————————————————————
// Global UI interactions
function initGlobalInteractions() {
  // "Go to Insights" buttons
  document.addEventListener('click', e => {
    if (e.target.closest('.go-to-ai-mode')) {
      e.preventDefault();
      window.location.href = '/wooai/';
    }
  });

  // Back to main site button
  document.addEventListener('click', e => {
    if (e.target.closest('.back-to-main')) {
      e.preventDefault();
      window.location.href = '/';
    }
  });

  // "Go to Data" buttons
  document.addEventListener('click', e => {
    if (e.target.closest('.go-to-data-button')) {
      e.preventDefault();
      window.location.href = '/datavis/';
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

// --------------------------------------
// AI Mode page interactions
function initAIMode() {
  const aiBtn = document.getElementById('ai-float-btn');
  if (!aiBtn) {
    console.warn('AI Button (#ai-float-btn) not found');
    return;
  }

  let modal = null;

  function createModal() {
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'ai-modal';
    modal.className = 'ai-modal';
    modal.innerHTML = `
          <div class="ai-modal-content">
              <button id="close-ai-btn" class="close-ai-btn" aria-label="Close AI Window" title="Close this window">
                  ✕
              </button>
              
              <div id="ai-loading" class="ai-loading">
                  <div class="ai-loading-spinner"></div>
                  <p>Loading AI Explorer...</p>
              </div>
              
              <iframe id="ai-frame" 
                      src="https://web-of-origins-ai.vercel.app/"
                      title="AI-assisted search – Web of Origins" 
                      allow="clipboard-write" 
                      loading="lazy">
              </iframe>
          </div>
      `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#close-ai-btn');
    const iframe = modal.querySelector('#ai-frame');
    const loadingUI = modal.querySelector('#ai-loading');

    // Close button
    closeBtn.addEventListener('click', closeAIModal);

    // Hide loading when iframe finishes loading
    iframe.addEventListener('load', () => {
      if (loadingUI) loadingUI.style.display = 'none';
    });

    // Close on click outside content
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAIModal();
    });

    return modal;
  }

  function openAIModal() {
    modal = createModal();
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    console.log('AI Explorer opened');
  }

  function closeAIModal() {
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  // Main click handler
  aiBtn.addEventListener('click', openAIModal);

  // Keyboard Escape support
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const currentModal = document.getElementById('ai-modal');
      if (currentModal && currentModal.style.display === 'flex') {
        closeAIModal();
      }
    }
  });
}

// ——————————————————————————————————————
// Header logic: mobile menu, sponsor CTA
function initHeader() {
  const menu = document.querySelector('.menu');
  const hamburger = document.querySelector('.hamburger-menu');
  const hamburgerIcon = hamburger?.querySelector('i');
  const menuItems = document.querySelector('.menu-items');

  if (!menu || !hamburger || !menuItems) return;

  // Desktop sponsor buttons
  document.addEventListener('click', e => {
    if (e.target.closest('.donate-button')) {
      e.preventDefault();
      window.location.href = '/sponsor/';
    }
  });


  
  const mainContent = document.querySelector('main');
  
  const openMenu = () => {
    menuItems.classList.add('menu-items-mobile_open');
    hamburgerIcon?.classList.replace('fa-bars', 'fa-xmark');
    mainContent.style.filter = 'blur(4px)';
    mainContent.style.opacity = '0.2';
  };

  const closeMenu = () => {
    menuItems.classList.remove('menu-items-mobile_open');
    hamburgerIcon?.classList.replace('fa-xmark', 'fa-bars');
    mainContent.style.filter = 'none';
    mainContent.style.opacity = '1';
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


  // — Hide menu on scroll down, show when scrolling up —
  let lastScrollTop = 0;
  const scrollThreshold = 8; // Minimal scroll to trigger hide

  window.addEventListener('scroll', () => {
    const currentScrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollDelta = Math.abs(currentScrollTop - lastScrollTop);

    // Hide menu only if scrolling down and delta is significant
    if (currentScrollTop > lastScrollTop && scrollDelta > scrollThreshold) {
      menu.style.transform = 'translateY(-100%)';
      menu.style.pointerEvents = 'none';
    } else if (currentScrollTop < lastScrollTop) {
      // Show menu when scrolling up
      menu.style.transform = 'translateY(0)';
      menu.style.pointerEvents = 'auto';
    }

    lastScrollTop = currentScrollTop;
  }, { passive: true });



  const toggleBtns = document.querySelectorAll('.theme-toggle');
  const icon = document.getElementById('theme-icon');
  const html = document.documentElement;

  // Default = Dark (your original theme)
  let currentTheme = localStorage.getItem('theme') || 'dark';

  function applyTheme(theme) {
    if (theme === 'light') {
      html.classList.add('light-mode');
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    } else {
      html.classList.remove('light-mode');
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    }
  }

  // Apply saved preference on load
  applyTheme(currentTheme);

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', currentTheme);
      applyTheme(currentTheme);
      console.log(`Theme switched to ${currentTheme}`);
    });
  })
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
        a.style.textTransform = 'capitalize';
        contentDiv.appendChild(a);

        // Type (bold)
        if (row.type && row.type.trim()) {
          const typeSpan = document.createElement('strong');
          typeSpan.textContent = ` | ${row.type.trim()} `;
          typeSpan.style.fontWeight = '600';
          typeSpan.style.textTransform = 'capitalize';
          contentDiv.appendChild(typeSpan);
        }

        // Tags
        if (row.tags && row.tags.trim()) {
          const span = document.createElement('span');
          span.textContent = ` – ${row.tags.trim()}`;
          span.style.color = 'var(--tinted-text-color)';
          span.style.fontSize = 'var(--small-text-size)';
          span.style.fontStyle = 'italic';
          span.style.textTransform = 'lowercase';
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


// function initThemeToggle() {
//   const toggleBtns = document.querySelectorAll('.theme-toggle');
//   const icon = document.getElementById('theme-icon');
//   const html = document.documentElement;

//   // Default = Dark (your original theme)
//   let currentTheme = localStorage.getItem('theme') || 'dark';

//   function applyTheme(theme) {
//     if (theme === 'light') {
//       html.classList.add('light-mode');
//       icon.classList.remove('fa-sun');
//       icon.classList.add('fa-moon');
//     } else {
//       html.classList.remove('light-mode');
//       icon.classList.remove('fa-moon');
//       icon.classList.add('fa-sun');
//     }
//   }

//   // Apply saved preference on load
//   applyTheme(currentTheme);

//   toggleBtns.forEach (btn => {
//     btn.addEventListener('click', () => {
//       currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
//       localStorage.setItem('theme', currentTheme);
//       applyTheme(currentTheme);
//       console.log(`Theme switched to ${currentTheme}`);
//     });
//   })
// }

// Donate button click handler
document.addEventListener('click', e => {
  const btn = e.target.closest('.donate-button');
  if (!btn) return;
  e.preventDefault();
  window.location.href = btn.dataset.url || '/sponsor/';
});



// Particles.js Background
particlesJS('particles-js', {
  "particles": {
    "number": { "value": 90, "density": { "enable": true, "value_area": 900 } },
    "color": { "value": ["#030173", "#5900fe", "#bce100", "#c51360"] },
    "shape": { "type": "circle" },
    "opacity": {
      "value": 0.55,
      "random": true,
      "anim": { "enable": true, "speed": 0.8, "opacity_min": 0.15 }
    },
    "size": {
      "value": 3,
      "random": true,
      "anim": { "enable": true, "speed": 2.5, "size_min": 0.1 }
    },
    "line_linked": {
      "enable": true,
      "distance": 200,
      "color": "#3896a7",
      "opacity": 0.4,
      "width": 1
    },
    "move": {
      "enable": true,
      "speed": 1.5,
      "direction": "none",
      "random": true,
      "straight": false,
      "out_mode": "out",
      "bounce": true,
      "attract": { "enable": false, "rotateX": 600, "rotateY": 1200 }
    }
  },
  "interactivity": {
    "detect_on": "canvas",
    "events": {
      "onhover": { "enable": true, "mode": "grab" },
      "onclick": { "enable": true, "mode": "push" },
      "resize": true
    },
    "modes": {
      "grab": { "distance": 180, "line_linked": { "opacity": 0.4 } },
      "push": { "particles_nb": 4 }
    }
  },
  "retina_detect": true
});