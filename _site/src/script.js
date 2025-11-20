// script.js — FINAL VERSION (2025 best practices)
// One source of truth: /src/header.html + /src/footer.html
// Always loaded via JS. No Jekyll includes. No duplication.

console.log('script.js loaded');

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Global interactions (always active)
  initGlobalInteractions();
  makeListingsClickable();

  // 2. Always load header & footer from /src/ — works everywhere
  try {
    await loadFragments();
    console.log('Header & footer loaded from /src/');
  } catch (err) {
    console.error('Failed to load header/footer:', err);
  }

  // 3. Initialize header logic + nav highlighting
  initHeader();
  highlightCurrentNav();
});

// ——————————————————————————————————————
// Load header/footer from /src/ (single source)
async function loadFragments() {
  const [headerHtml, footerHtml] = await Promise.all([
    fetch('/src/header.html').then(r => r.ok ? r.text() : ''),
    fetch('/src/footer.html').then(r => r.ok ? r.text() : '')
  ]);

  if (headerHtml) document.querySelector('header').innerHTML = headerHtml;
  if (footerHtml) document.querySelector('footer').innerHTML = footerHtml;
}

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
// Highlight current page in nav
function highlightCurrentNav() {
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';

  document.querySelectorAll('ul.menu-items li a').forEach(link => {
    let href = (link.getAttribute('href') || '').replace(/\/+$/, '');

    const isMatch =
      href === currentPath ||
      (currentPath === '/' && (href === '' || href === '/index')) ||
      (href === '/' && currentPath === '/index');

    if (isMatch) link.classList.add('current');
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

  // Desktop sponsor buttons — delegation (works forever)
  document.addEventListener('click', e => {
    if (e.target.closest('.sponsor-cta')) {
      e.preventDefault();
      window.location.href = '/pages/sponsor';
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
      window.location.href = '/pages/sponsor';
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