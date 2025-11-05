---
layout: grid
title: Insights
permalink: /blog/
---

<h1 class="article-header">Latest Insights</h1>
<p class="intro-text">Dive deeper into our findings</p>

<ul class="listing-grid">
    {% for post in site.posts %}
    <li data-post-url="{{ post.url }}">
        <img class="image-thumbnail" src="{{ post.image }}" alt="Post Image" />
        <a href="{{ post.url }}"><h5>{{ post.title }}</h5></a>
        <span class="meta-block">
            {% if post.industry %}
            <p class="post-meta"><b>Industries:</b> {{ post.industry | array_to_sentence_string }}</p>
            {% endif %}
            {% if post.impact %}
            <p class="post-meta"><b>Impacts:</b> {{ post.impact | array_to_sentence_string }}</p>
            {% endif %}
        </span>
        {{ post.excerpt }}
        <a href="{{ post.url }}" class="panel-cta">Read More</a>
    </li>
    {% endfor %}
</ul>