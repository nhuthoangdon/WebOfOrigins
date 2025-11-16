// pages scripts, excludes Vis.js script

console.log('script.js is loaded and running');

function goToInsights() {
  $('.go-to-insights').on('click', function () {
    window.location.href = '/blog/';
  });
}

function animatedSponsorCTAs() {
  $('.donate-links a.large-cta-link').on('mouseover', function() {
    $(this).find('i').addClass('fa-beat');
  });

  $('.donate-links a.large-cta-link').on('mouseout', function () {
    $(this).find('i').removeClass('fa-beat');
  });
}

document.addEventListener("DOMContentLoaded", function () {

  animatedSponsorCTAs();

  // --- Load fragments in parallel ---
  const headerPromise = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/src/header.html', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          document.querySelector('header').innerHTML = xhr.responseText;
          resolve();
        } else {
          reject(new Error(xhr.status));
        }
      }
    };
    xhr.send();
  });

  const footerPromise = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/src/footer.html', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          document.querySelector('footer').innerHTML = xhr.responseText;
          resolve();
        } else {
          reject(new Error(xhr.status));
        }
      }
    };
    xhr.send();
  });

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



// ⚠️ IMPORTANT: Replace 'your-secret-key' with your actual Cloudflare Secret Key.
const SECRET_KEY = '0x4AAAAAACBLTjaYeRJbPXDXNqaE9Rk08Vs';

/**
 * Validates the Turnstile token against the Cloudflare API.
 * @param {string} token - The cf-turnstile-response token from the client.
 * @param {string} remoteip - The user's IP address.
 * @returns {Promise<object>} The JSON response from the siteverify API.
 */
async function validateTurnstile(token, remoteip) {
  // Note: Using URLSearchParams for cleaner URL-encoded body generation
  const body = new URLSearchParams({
    secret: SECRET_KEY,
    response: token,
    remoteip: remoteip,
  });

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: body
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Turnstile validation error:', error);
    // Ensure a predictable failure structure
    return { success: false, 'error-codes': ['internal-error'] };
  }
}

// --- Server-Side Route Handler for Token Validation ---

/**
 * Example handler for a dedicated API endpoint (e.g., POST /validate-turnstile).
 * This function handles the incoming validation request from the client-side script.
 * @param {Request} request - The incoming HTTP request object.
 * @returns {Response} A JSON response indicating success or failure.
 */
async function handleTokenValidation(request) {
  // 1. Get the token and IP from the request body and headers.
  const body = await request.json(); // Assuming client sends JSON body
  const token = body.token;

  // Attempt to get the real IP address from standard headers
  const ip = request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For') ||
    'unknown';

  // 2. Validate the token.
  const validation = await validateTurnstile(token, ip);

  if (validation.success) {
    // Token is valid - you can set a session cookie here to track the validated user
    console.log('Valid verification from:', validation.hostname);

    // Respond with success to the client
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    // Token is invalid - Cloudflare detected bot or challenge failed
    console.log('Invalid token:', validation['error-codes']);

    // Respond with failure to the client
    return new Response(JSON.stringify({ success: false, errors: validation['error-codes'] }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}