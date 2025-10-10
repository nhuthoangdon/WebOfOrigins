// pages scripts, excludes Vis.js script

console.log('script.js is loaded and running');

$(document).ready(function () {
  // Header sponsor CTA button logic
  const sponsorButton = document.getElementById('header-sponsor-cta');
  const sponsorLink = './about#sponsor-links';

  if (sponsorButton) {
    sponsorButton.addEventListener('click', function () {
      window.location.href = sponsorLink;
    });
  }

  const $menu = $('.menu');
  const $hamburger = $('.hamburger-menu');
  const $hamburgerIcon = $hamburger.find('i');
  const $menuItems = $('.menu-items');

  // Create mobile-only CTA button once
  const $mobileSponsorCTA = $('<button>', {
    text: 'Support This Project',
    class: 'primary-button sponsor-button-mobile'
  });

  if ($mobileSponsorCTA.length) {
    $mobileSponsorCTA.on('click', function (e) {
      e.stopPropagation(); // prevent closing the menu
      window.location.href = sponsorLink;
    });
  }
  

  // Helper: check if viewport is mobile
  function isBreakpoint961() {
    return window.matchMedia('(max-width: 961px)').matches;
  }

  // Append CTA only in mobile view
  function ensureMobileCTA() {
    if (isBreakpoint961()) {
      // Only append if it doesn't exist already
      if ($menuItems.find('.primary-button').length === 0) {
        $menuItems.append($mobileSponsorCTA);
      }
    } else {
      // Remove CTA when resizing to desktop
      $mobileSponsorCTA.detach();
    }
  }

  // Open the menu
  function openMenu() {
    ensureMobileCTA();
    $menuItems.addClass('menu-items-mobile_open');
    $hamburgerIcon.removeClass('fa-bars').addClass('fa-xmark');
  }

  // Close the menu
  function closeMenu() {
    $menuItems.removeClass('menu-items-mobile_open');
    $hamburgerIcon.removeClass('fa-xmark').addClass('fa-bars');
  }

  // Toggle menu on hamburger click
  $hamburger.on('click', function (e) {
    e.stopPropagation();
    if ($hamburgerIcon.hasClass('fa-xmark')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close menu on scroll
  $(window).on('scroll', closeMenu);

  // Close menu on clicking outside
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

  // Check/resync button when resizing
  $(window).on('resize', ensureMobileCTA);

  // Initial check (in case loaded on mobile)
  ensureMobileCTA();


});