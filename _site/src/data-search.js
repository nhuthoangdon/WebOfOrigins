// /src/data-search.js
console.log('data-search.js loaded');

if (document.getElementById("large-search-input") && !document.getElementById("network")) {
    // Wait for vis-script to load and initialize search
    setTimeout(() => {
        if (typeof window.initLargeSearchForHomepage === "function") {
            window.initLargeSearchForHomepage();
        } else {
            console.error("initLargeSearchForHomepage not found");
        }
    }, 800);
}