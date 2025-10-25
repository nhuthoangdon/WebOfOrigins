---
layout: grid
title: Insights
permalink: /blog/
---

<h2>Latest Insights</h2>
<p class="intro-text">Dive deeper into our findings</p>

<ul class="listing-grid">
    {% for post in site.posts %}
    <li>
        <img class="image-thumbnail" src="{{ post.image }}" alt="Post Image" />
        <h5><a href="{{ post.url }}">{{ post.title }}</a></h5>
        {{ post.excerpt }}
        <a href="{{ post.url }}" class="panel-cta-link"><button class="btn-tertiary">View Insight</button></a>
    </li>
    {% endfor %}
</ul>