// pages scripts, excludes Vis.js script

console.log('script.js is loaded and running');

$(document).ready(function() {
  $('.hamburger-menu').click(function() {
    $('.menu-items').toggleClass('menu-mobile').css({
      'display': function() {
        return $(this).hasClass('menu-mobile') ? 'flex' : 'none';
      },
      'transition': 'opacity 0.3s ease, transform 0.3s ease',
      'opacity': function() {
        return $(this).hasClass('menu-mobile') ? '1' : '0';
      },
      'transform': function() {
        return $(this).hasClass('menu-mobile') ? 'translateY(0)' : 'translateY(-10px)';
      }
    });
  });

  $(window).scroll(function() {
    if ($('.menu-items').hasClass('menu-mobile')) {
      $('.menu-items').removeClass('menu-mobile').css({
        'display': 'none',
        'opacity': '0',
        'transform': 'translateY(-10px)'
      });
    }
  });
});



