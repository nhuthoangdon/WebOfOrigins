// pages scripts, excludes Vis.js script

console.log('script.js is loaded and running');

function goToInsights() {
  $('.go-to-insights').on('click', function () {
    window.location.href = '/blog/';
  });
}

function animatedSponsorCTAs() {
  $('.sponsor-links a.large-cta-link').on('mouseover', function() {
    $(this).find('i').addClass('fa-beat');
  });

  $('.sponsor-links a.large-cta-link').on('mouseout', function () {
    $(this).find('i').removeClass('fa-beat');
  });
}

document.addEventListener("DOMContentLoaded", function () {

  animatedSponsorCTAs();

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
    let currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
    document.querySelectorAll("ul.menu-items li a").forEach(link => {
      let href = link.getAttribute("href");
      if (!href) return;
      href = href.replace(/\/+$/, ''); // Normalize href
      // Match if paths equal, or special case for home (/index or /)
      if (href === currentPath ||
        (currentPath === '/' && (href === '/index' || href === '')) ||
        (href === '/' && currentPath === '/index')) {
        link.classList.add("current");
      }
    });
  }


  // --- Initialize header interactions ---
  function initHeader() {
    const sponsorLink = '/pages/sponsor';
    const sponsorButtons = document.querySelectorAll('.sponsor-cta');

    // Sponsor button (desktop)
    if (sponsorButtons.length > 0) {
      sponsorButtons.forEach(button => {
        button.addEventListener('click', function () {
          window.location.href = sponsorLink;
        });
      })
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
  
  // Make cards/panels clickable and links to respective posts
  document.querySelectorAll('.listing-grid li').forEach(li => {
    const postUrl = li.closest('li').dataset.postUrl;
    if (postUrl) {
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        window.location.href = postUrl;
      });
      // Preserve button click
      li.querySelector('.panel-cta')?.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  });

  goToInsights();

});
