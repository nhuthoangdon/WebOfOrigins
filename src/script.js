// pages scripts, excludes Home

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html'; // Get current page name
    const menuLinks = document.querySelectorAll('.menu a');

    menuLinks.forEach(link => {
        const href = link.getAttribute('href').split('/').pop(); // Get link's target page
        if (href === currentPage) {
            link.classList.add('current');
        }
    });
});
