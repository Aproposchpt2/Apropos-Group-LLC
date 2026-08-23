'use strict';

const fs = require('fs');

const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');

// Pricing is source-controlled. The build MUST NOT silently repair stale values,
// because doing so can hide a bad committed source and allow old pricing to
// reappear through alternate deploy paths or later merges.
const AUTHORITATIVE_ANALYZE_FIT_PRICE = 'Additional report · $79.00 one-time';
const pricePattern = /Additional report · \$([0-9]+(?:\.[0-9]{1,2})?) one-time/g;
const priceMatches = [...html.matchAll(pricePattern)];
if (priceMatches.length !== 1 || priceMatches[0][0] !== AUTHORITATIVE_ANALYZE_FIT_PRICE) {
  throw new Error(`Corporate pricing validation failed: expected exactly one "${AUTHORITATIVE_ANALYZE_FIT_PRICE}" in committed index.html.`);
}

const match = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
if (!match) throw new Error('Corporate entity remediation: JSON-LD block not found.');

const data = JSON.parse(match[1]);
const graph = Array.isArray(data['@graph']) ? data['@graph'] : [];
const corporateId = 'https://aproposgroupllc.com/#organization';
const org = graph.find(node => node && node['@id'] === corporateId);
if (!org) throw new Error('Corporate entity remediation: APROPOS Organization node not found.');

org.telephone = '+1-888-244-5737';
org.email = 'jmitchell@aproposgroupllc.com';
org.naics = ['541511', '541512', '541519', '541611', '541614', '541618'];
org.contactPoint = {
  '@type': 'ContactPoint',
  contactType: 'business inquiries',
  telephone: '+1-888-244-5737',
  email: 'jmitchell@aproposgroupllc.com',
  areaServed: 'US',
  availableLanguage: 'en'
};
org.subOrganization = [
  {
    '@type': 'Organization',
    '@id': 'https://nebc.aproposgroupllc.com/#organization',
    name: 'National Enterprise Business Center',
    alternateName: 'NEBC',
    url: 'https://nebc.aproposgroupllc.com/'
  },
  {
    '@type': 'Organization',
    '@id': 'https://federalcontractorportal.aproposgroupllc.com/#organization',
    name: 'Registered Federal Contractors Portal',
    alternateName: ['National Government Contract Center', 'NGCC'],
    url: 'https://federalcontractorportal.aproposgroupllc.com/'
  },
  {
    '@type': 'Organization',
    '@id': 'https://natcorp.aproposgroupllc.com/#organization',
    name: 'National Corporate Contract Exchange',
    alternateName: 'NAT-CORP',
    url: 'https://natcorp.aproposgroupllc.com/'
  },
  {
    '@type': 'Organization',
    '@id': 'https://marketplace.aproposgroupllc.com/#organization',
    name: 'APROPOS Marketing Marketplace',
    url: 'https://marketplace.aproposgroupllc.com/'
  }
];

// AI4 properties are APROPOS brands/services/web properties. They are not
// represented as separate legal organizations. This keeps the public entity
// graph aligned with the actual product architecture.
org.brand = [
  {
    '@type': 'Brand',
    '@id': 'https://ai4businesses.org/#brand',
    name: 'AI4 Businesses',
    url: 'https://ai4businesses.org/'
  },
  {
    '@type': 'Brand',
    '@id': 'https://ai4websitedesign.com/#brand',
    name: 'AI4 Website Design Studio',
    url: 'https://ai4websitedesign.com/'
  }
];

function upsertGraphNode(id, node) {
  const index = graph.findIndex(item => item && item['@id'] === id);
  if (index >= 0) graph[index] = node;
  else graph.push(node);
}

upsertGraphNode('https://ai4businesses.org/#website', {
  '@type': 'WebSite',
  '@id': 'https://ai4businesses.org/#website',
  url: 'https://ai4businesses.org/',
  name: 'AI4 Businesses',
  publisher: { '@id': corporateId },
  inLanguage: 'en-US'
});
upsertGraphNode('https://ai4businesses.org/#service', {
  '@type': 'Service',
  '@id': 'https://ai4businesses.org/#service',
  name: 'AI4 Businesses',
  url: 'https://ai4businesses.org/',
  serviceType: 'Business process automation and AI workflow systems',
  provider: { '@id': corporateId },
  mainEntityOfPage: { '@id': 'https://ai4businesses.org/#website' }
});
upsertGraphNode('https://ai4websitedesign.com/#website', {
  '@type': 'WebSite',
  '@id': 'https://ai4websitedesign.com/#website',
  url: 'https://ai4websitedesign.com/',
  name: 'AI4 Website Design Studio',
  publisher: { '@id': corporateId },
  inLanguage: 'en-US',
  workTranslation: { '@id': 'https://espanola.ai4websitedesign.com/#website' }
});
upsertGraphNode('https://espanola.ai4websitedesign.com/#website', {
  '@type': 'WebSite',
  '@id': 'https://espanola.ai4websitedesign.com/#website',
  url: 'https://espanola.ai4websitedesign.com/',
  name: 'AI4 Website Design Studio — Español',
  publisher: { '@id': corporateId },
  inLanguage: 'es',
  translationOfWork: { '@id': 'https://ai4websitedesign.com/#website' }
});
upsertGraphNode('https://ai4websitedesign.com/#application', {
  '@type': 'WebApplication',
  '@id': 'https://ai4websitedesign.com/#application',
  name: 'AI4 Website Design Studio',
  url: 'https://ai4websitedesign.com/',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  inLanguage: ['en-US', 'es'],
  provider: { '@id': corporateId },
  isPartOf: { '@id': 'https://ai4websitedesign.com/#website' }
});

data['@graph'] = graph;
const replacement = `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n  </script>`;
html = html.replace(match[0], replacement);

// Phase 2B performance: make the CSS hero background discoverable immediately.
const heroHref = '/assets/headquarters.webp';
const heroPreload = `<link rel="preload" as="image" href="${heroHref}" type="image/webp" fetchpriority="high" />`;
if (!html.includes(heroHref)) throw new Error('Corporate performance remediation: active hero asset not found.');
if (!html.includes(heroPreload)) {
  if (!/<\/head>/i.test(html)) throw new Error('Corporate performance remediation: closing head tag not found.');
  html = html.replace(/<\/head>/i, `  ${heroPreload}\n</head>`);
}

const required = [
  AUTHORITATIVE_ANALYZE_FIT_PRICE,
  'https://federalcontractorportal.aproposgroupllc.com/#organization',
  'https://natcorp.aproposgroupllc.com/#organization',
  'https://nebc.aproposgroupllc.com/#organization',
  'https://marketplace.aproposgroupllc.com/#organization',
  'https://ai4businesses.org/#brand',
  'https://ai4businesses.org/#service',
  'https://ai4websitedesign.com/#brand',
  'https://ai4websitedesign.com/#application',
  'https://espanola.ai4websitedesign.com/#website',
  'National Government Contract Center',
  'jmitchell@aproposgroupllc.com',
  heroPreload
];
for (const value of required) if (!html.includes(value)) throw new Error(`Corporate entity remediation validation failed: missing ${value}`);
const postTransformPriceMatches = [...html.matchAll(pricePattern)];
if (postTransformPriceMatches.length !== 1 || postTransformPriceMatches[0][0] !== AUTHORITATIVE_ANALYZE_FIT_PRICE) {
  throw new Error('Corporate entity remediation validation failed: Analyze Fit price drift detected.');
}
if ((html.match(/rel="preload" as="image" href="\/assets\/headquarters\.webp"/g) || []).length !== 1) throw new Error('Corporate performance remediation: hero preload must appear exactly once.');

fs.writeFileSync(file, html, 'utf8');

// Re-read the publish artifact after writing so a successful build cannot report
// PASS while leaving a stale public price in the actual file Netlify publishes.
const publishedHtml = fs.readFileSync(file, 'utf8');
const publishedPriceMatches = [...publishedHtml.matchAll(pricePattern)];
if (publishedPriceMatches.length !== 1 || publishedPriceMatches[0][0] !== AUTHORITATIVE_ANALYZE_FIT_PRICE) {
  throw new Error('Corporate post-write validation failed: authoritative Analyze Fit price drifted in publish artifact.');
}
if ((publishedHtml.match(/rel="preload" as="image" href="\/assets\/headquarters\.webp"/g) || []).length !== 1) throw new Error('Corporate post-write validation failed: hero preload must appear exactly once in publish artifact.');
for (const value of [
  'https://ai4businesses.org/#service',
  'https://ai4websitedesign.com/#application',
  'https://espanola.ai4websitedesign.com/#website'
]) {
  if (!publishedHtml.includes(value)) throw new Error(`Corporate post-write validation failed: missing AI4 entity ${value}`);
}

console.log('[corporate-search-entity] PASS — authoritative pricing, hero preload, and current APROPOS/AI4 entity relationships enforced.');
require('./apply-nonblocking-fonts.cjs');
