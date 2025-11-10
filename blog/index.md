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
        <a href="{{ post.url }}"><h4>{{ post.title }}</h4></a>
        <span class="meta-block">
            {% if post.industry %}
            <p class="post-meta"><b>Industries:</b> {{ post.industry | array_to_sentence_string }}</p>
            {% endif %}
            {% if post.impact %}
            <p class="post-meta"><b>Impacts:</b> {{ post.impact | array_to_sentence_string }}</p>
            {% endif %}
        </span>
        {{ post.excerpt }}
        <a href="{{ post.url }}" class="panel-cta"><span class ="icon icon-solid icon-chevron-right">Read More</span></a>
    </li>
    {% endfor %}
</ul>

<hr>

<section class="follow-socials">
    <h2>Stay Connected</h2>
    <div class="social-ctas">
        <a href="https://twitter.com/WebOfOrigins" target="_blank" class="social-cta">
            <i class="fa-brands fa-x-twitter fa-lg"></i></a>
        <a href="https://www.facebook.com/WebOfOrigins" target="_blank" class="social-cta">
            <i class="fa-brands fa-facebook-f fa-lg"></i></a>
        <a href="https://www.linkedin.com/company/weboforigins" target="_blank" class="social-cta">
            <i class="fa-brands fa-linkedin-in fa-lg"></i></a>
    </div>
</section>