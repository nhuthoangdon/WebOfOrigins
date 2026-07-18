---
layout: tags
permalink: /taglist/
description: Discover related tags and topic clusters to find connected content across the Web of Origins knowledge graph.
title: Sort by Tags — Discover Connected Origins Topics
---

<script>
document.addEventListener("DOMContentLoaded", function () {
  const hash = window.location.hash.substring(1);
  if (!hash) return;

  const groups = document.querySelectorAll(".tag-group");

  groups.forEach(group => {
    if (group.id !== hash) {
      group.style.display = "none";
    }
  });
});
</script>

<script>
document.addEventListener("DOMContentLoaded", function () {
  const hash = window.location.hash.substring(1);
  if (!hash) return;

  // Update H1
  const formatted = hash.replace(/-/g, ' ');
  const title = formatted.charAt(0).toUpperCase() + formatted.slice(1);

  const heading = document.getElementById("page-title");
  if (heading) {
    heading.textContent = "Tag: " + title;
  }

  // Filter sections
  document.querySelectorAll(".tag-group").forEach(group => {
    if (group.id !== hash) {
      group.style.display = "none";
    }
  });

  // Update browser title
  document.title = "Tag: " + title + " | " + document.title;
});
</script>