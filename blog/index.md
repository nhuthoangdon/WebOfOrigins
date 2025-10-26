---
layout: grid
title: Insights
permalink: /blog/
---

<h2>Latest Insights</h2>
<p class="intro-text">Dive deeper into our findings</p>

<ul class="listing-grid">
    {% for post in site.posts %}
    <li data-post-url="{{ post.url }}">
        <img class="image-thumbnail" src="{{ post.image }}" alt="Post Image" />
        <h5>{{ post.title }}</h5>
        <span class="meta-block">
        {% if post.industry %}
        <p class="post-meta"><b>Industries:</b> {{ post.industry | join: ', ' }}</p>
        {% endif %}
        {% if post.impact %}
        <p class="post-meta"><b>Impacts:</b> {{ post.impact | join: ', ' }}</p>
        {% endif %}
        </span>
        {{ post.excerpt }}
        <a href="{{ post.url }}" class="panel-cta-link"><button class="btn-tertiary">Read More</button></a>
    </li>
    {% endfor %}
</ul>