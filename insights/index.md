---
layout: grid
title: Insights
permalink: /insights
description: "Read in-depth insights on topics relating to consumer products, industries, material sourcing, and environmental and ethical impacts of human development and sustainability"
---

<main class="wide-width-section">
    <h1 class="article-header">Insights</h1>
    <h3>Science-backed articles on the origins, efficacy, and environmental impacts of substances, ingredients, and materials.</h3>
    <p class="intro-text">From dietary supplements to hidden ingredients in everyday products, Web of Origins delivers free, evidence-based insights on where things come from, how effective they are, and what environmental and ethical impacts they carry.</p>
    <ul class="listing-grid">
        {% for post in site.posts %}
        <li data-post-url="{{ post.url }}">
            <img class="image-thumbnail" src="{{ post.image }}" alt="Featured image for {{ post.short_title }}" />
            <a href="{{ post.url }}" aria-label="Read the full insight: {{ post.title }}" title="Read the full insight: {{ post.title }}"><h4>{{ post.short_title }}</h4></a>
            <span class="meta-block">
                <!-- {% if post.industry %}
                <p class="post-meta"><b>Industries:</b> {{ post.industry | array_to_sentence_string }}</p>
                {% endif %}
                {% if post.impact %}
                <p class="post-meta"><b>Impacts:</b> {{ post.impact | array_to_sentence_string }}</p>
                {% endif %} -->
                {% if post.topic %}
                <p class="post-meta"><b>Topic:</b> {{ post.topic }}</p>
                {% endif %}
                {% if post.tags %}
                <p class="post-meta"><b>Tags:</b>
                    {% for tag in post.tags %}
                    <a class="tag-links" href="{{ '/browse-by-tags' | relative_url }}#{{ tag | slugify }}" aria-label="View insights tagged {{ tag }}" title="View insights tagged {{ tag }}">{{ tag }}</a>{% unless forloop.last %}, {% endunless %}
                    {% endfor %}
                </p>
                {% endif %}
            </span>
            <div class="post-excerpt">
            {{ post.excerpt }}
            </div>
            <a href="{{ post.url }}" class="panel-cta" aria-label="Read more about {{ post.topic }}" title="Read more about {{ post.topic }}"><span class ="icon icon-solid icon-chevron-right">Read More</span></a>
        </li>
        {% endfor %}
    </ul>
</main>

<div class="cta-banner" role="region" aria-label="Explore the data visually">
    <div class="cta-banner-content">
        <div class="cta-copy">
        <h2>Explore Data Visually</h2>
        <p>View connections between products, materials, industries, and impacts in an interactive visualisation.</p>
        </div>
        <div class="cta-actions">
        <button type="button" data-url="/datavis/" class="primary-button go-to-data-button" title="Open Data Visualisation">
            Data Visualisation <i class="fa-solid fa-arrow-right-long" aria-hidden="true"></i>
        </button>
        </div>
    </div>
</div>


<hr>

<section class="follow-socials">
    <h2>Stay Connected</h2>
    <div class="social-ctas">
        <a href="https://twitter.com/WebOfOrigins" target="_blank" class="social-cta" rel="noopener noreferrer" aria-label="Open Web of Origins Twitter profile in a new tab" title="Open Web of Origins Twitter profile in a new tab">
            <i class="fa-brands fa-x-twitter fa-lg"></i></a>
        <a href="https://www.facebook.com/WebOfOrigins" target="_blank" class="social-cta" rel="noopener noreferrer" aria-label="Open Web of Origins Facebook page in a new tab" title="Open Web of Origins Facebook page in a new tab">
            <i class="fa-brands fa-facebook-f fa-lg"></i></a>
        <a href="https://www.linkedin.com/company/weboforigins" target="_blank" class="social-cta" rel="noopener noreferrer" aria-label="Open Web of Origins LinkedIn page in a new tab" title="Open Web of Origins LinkedIn page in a new tab">
            <i class="fa-brands fa-linkedin-in fa-lg"></i></a>
    </div>
</section>