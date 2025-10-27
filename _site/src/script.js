// pages scripts, excludes Vis.js script

console.log('script.js is loaded and running');

$(document).ready(function () {

  // --- Load fragments in parallel ---
  const headerPromise = fetch('/src/header.html')
    .then(res => res.text())
    .then(html => {
      document.querySelector('header').innerHTML = html;
    })
    .catch(err => console.error('Header failed to load:', err));

  const footerPromise = fetch('/src/footer.html')
    .then(res => res.text())
    .then(html => {
      document.querySelector('footer').innerHTML = html;
    })
    .catch(err => console.error('Footer failed to load:', err));

  // --- Once both are loaded ---
  Promise.all([headerPromise, footerPromise]).then(() => {
    console.log('Header and footer loaded successfully.');

    initHeader();          // attach logic to header
    highlightCurrentNav(); // mark active page
  });


  // --- Highlight current page in nav ---
  function highlightCurrentNav() {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("ul.menu-items li a").forEach(link => {
      const href = link.getAttribute("href");
      if (href && href.includes(currentPath)) {
        link.classList.add("current");
      }
    });
  }


  // --- Initialize header interactions ---
  function initHeader() {
    const sponsorLink = '/about#sponsor-links-anchor';
    const sponsorButton = document.getElementById('header-sponsor-cta');

    // Sponsor button (desktop)
    if (sponsorButton) {
      sponsorButton.addEventListener('click', function () {
        window.location.href = sponsorLink;
      });
    }

    // --- Menu logic ---
    const $menu = $('.menu');
    const $hamburger = $('.hamburger-menu');
    const $hamburgerIcon = $hamburger.find('i');
    const $menuItems = $('.menu-items');

    // Mobile-only CTA
    const $mobileSponsorCTA = $('<button>', {
      text: 'Support This Project',
      class: 'primary-button sponsor-button-mobile'
    }).on('click', function (e) {
      e.stopPropagation();
      window.location.href = sponsorLink;
    });

    // Helper for viewport check
    function isMobileView() {
      return window.matchMedia('(max-width: 961px)').matches;
    }

    // Ensure CTA appears only on mobile
    function ensureMobileCTA() {
      if (isMobileView()) {
        if ($menuItems.find('.primary-button').length === 0) {
          $menuItems.append($mobileSponsorCTA);
        }
      } else {
        $mobileSponsorCTA.detach();
      }
    }

    // Menu open/close
    function openMenu() {
      ensureMobileCTA();
      $menuItems.addClass('menu-items-mobile_open');
      $hamburgerIcon.removeClass('fa-bars').addClass('fa-xmark');
    }

    function closeMenu() {
      $menuItems.removeClass('menu-items-mobile_open');
      $hamburgerIcon.removeClass('fa-xmark').addClass('fa-bars');
    }

    // Event listeners
    $hamburger.on('click', function (e) {
      e.stopPropagation();
      if ($hamburgerIcon.hasClass('fa-xmark')) closeMenu();
      else openMenu();
    });

    $(window).on('scroll', closeMenu);

    $(document).on('click', function (e) {
      if (
        !$menu.is(e.target) &&
        $menu.has(e.target).length === 0 &&
        !$hamburger.is(e.target) &&
        $hamburger.has(e.target).length === 0
      ) {
        closeMenu();
      }
    });

    $(window).on('resize', ensureMobileCTA);
    ensureMobileCTA(); // Initial check
  }


  // Make list items clickable and link to respective posts
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.listing-grid li').forEach(li => {
      const url = li.querySelector('a')?.getAttribute('href');
      if (url) {
        li.style.cursor = 'pointer';
        li.addEventListener('click', (e) => {
          // Prevent navigation if clicking on button or link inside
          if (e.target.closest('a, button')) return;
          window.location.href = url;
        });
        // Optional: keyboard accessibility
        li.setAttribute('tabindex', '0');
        li.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            window.location.href = url;
          }
        });
      }
    });
  });
  
  // Make cards/panels clickable and links to respective posts
  document.querySelectorAll('.listing-grid li').forEach(li => {
    const postUrl = li.closest('li').dataset.postUrl;
    if (postUrl) {
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        window.location.href = postUrl;
      });
      // Preserve button click
      li.querySelector('.btn-tertiary')?.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  });
});
