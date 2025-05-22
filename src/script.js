// pages scripts, excludes Vis.js script

console.log('script.js is loaded and running');

$(document).ready(function() {
  $('.hamburger-menu').click(function() {
    $('.menu-items').toggleClass('menu-mobile').css('display', function() {
      return $(this).hasClass('menu-mobile') ? 'flex' : 'none';
    });
  });
});


// $(document).ready(function() {
//   $('.hamburger-menu').click(function() {
//     console.log('Hamburger clicked');
//     $('.menu-items').css('display', 'flex').addClass('menu-mobile');
//   });
// });

