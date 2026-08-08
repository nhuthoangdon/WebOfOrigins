const API_CATALOG = JSON.stringify({
  version: "1.0",
  title: "Web of Origins API Catalog",
  description: "Machine-readable agent discovery catalog for Web of Origins.",
  entries: [
    {
      service: "weboforigins",
      description: "OpenAPI service description for Web of Origins",
      api: "/openapi.yaml",
      docs: "/ai-plugin.json"
    }
  ]
});

const OPENAPI_YAML = `openapi: 3.0.3
info:
  title: Web of Origins
  version: 1.0.0
  description: OpenAPI service description for Web of Origins.
servers:
  - url: https://weboforigins.com
paths:
  /:
    get:
      summary: Homepage
      description: Returns the Web of Origins homepage.
      responses:
        '200':
          description: Successful response
`;

const AI_PLUGIN = JSON.stringify({
  schema_version: "1.1",
  name_for_human: "Web of Origins",
  name_for_model: "web_of_origins",
  description_for_human: "Explore product origins, ingredient supply chains, and sustainability impacts.",
  description_for_model: "Use this plugin to browse the Web of Origins site and retrieve information about origins, connections, and references.",
  auth: { type: "none" },
  api: {
    type: "openapi",
    url: "https://weboforigins.com/openapi.yaml",
    is_user_authenticated: false
  },
  logo_url: "https://weboforigins.com/favicon.ico",
  contact_email: "support@weboforigins.com",
  legal_info_url: "https://weboforigins.com/pages/privacy.html"
});

const DISCOVERY_LINKS = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</openapi.yaml>; rel="service-desc"',
  '</ai-plugin.json>; rel="service-doc"',
  '</.well-known/ai-plugin.json>; rel="describedby"'
];

function buildLinkHeaders(response) {
  const modified = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
  DISCOVERY_LINKS.forEach((value) => modified.headers.append("Link", value));
  return modified;
}

function jsonResponse(body) {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

function yamlResponse(body) {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/yaml;charset=UTF-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/.well-known/api-catalog") {
      return jsonResponse(API_CATALOG);
    }

    if (pathname === "/openapi.yaml") {
      return yamlResponse(OPENAPI_YAML);
    }

    if (pathname === "/ai-plugin.json" || pathname === "/.well-known/ai-plugin.json") {
      return jsonResponse(AI_PLUGIN);
    }

    const response = await fetch(request);

    if (pathname === "/" || pathname === "/index.html") {
      return buildLinkHeaders(response);
    }

    return response;
  }
};
