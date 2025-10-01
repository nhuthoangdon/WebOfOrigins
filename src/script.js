// pages scripts, excludes Vis.js script

console.log('script.js is loaded and running');

//MENU - MOBILE TOGGLE
$(document).ready(function () {
  const $menu = $('.menu-items');
  const $hamburger = $('.hamburger-menu');

  // Helper: Open the menu
  function openMenu() {
    $menu.addClass('menu-mobile').css({
      'display': 'flex',
      'transition': 'opacity 0.3s ease, transform 0.3s ease',
      'opacity': '1',
      'transform': 'translateY(0)'
    });
  }

  // Helper: Close the menu
  function closeMenu() {
    $menu.removeClass('menu-mobile').css({
      'display': 'none',
      'opacity': '0',
      'transform': 'translateY(-10px)'
    });
  }

  // Toggle menu on hamburger click
  $hamburger.click(function (e) {
    e.stopPropagation(); // stop click from reaching document
    if ($menu.hasClass('menu-mobile')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close menu on scroll
  $(window).scroll(function () {
    if ($menu.hasClass('menu-mobile')) {
      closeMenu();
    }
  });

  // Close menu on clicking outside
  $(document).click(function (e) {
    if (
      $menu.hasClass('menu-mobile') &&
      !$menu.is(e.target) && $menu.has(e.target).length === 0 &&
      !$hamburger.is(e.target) && $hamburger.has(e.target).length === 0
    ) {
      closeMenu();
    }
  });
});




