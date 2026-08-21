'use strict';

const fs = require('fs');

const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');

// One authoritative Analyze Fit price across the APROPOS ecosystem.
// Normalize all known legacy/current shorthand variants to the exact public price.
html = html
  .replaceAll('Additional report · $15 one-time', 'Additional report · $79.00 one-time')
  .replaceAll('Additional report · $49.99 one-time', 'Additional report · $79.00 one-time')
  .replaceAll('Additional report · $79 one-time', 'Additional report · $79.00 one-time');

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
  'Additional report · $79.00 one-time',
  'https://federalcontractorportal.aproposgroupllc.com/#organization',
  'https://natcorp.aproposgroupllc.com/#organization',
  'https://nebc.aproposgroupllc.com/#organization',
  'https://marketplace.aproposgroupllc.com/#organization',
  'National Government Contract Center',
  'jmitchell@aproposgroupllc.com',
  heroPreload
];
for (const value of required) if (!html.includes(value)) throw new Error(`Corporate entity remediation validation failed: missing ${value}`);
if (html.includes('Additional report · $15 one-time')) throw new Error('Corporate entity remediation validation failed: stale $15 Analyze Fit price remains.');
if (html.includes('Additional report · $49.99 one-time')) throw new Error('Corporate entity remediation validation failed: stale $49.99 Analyze Fit price remains.');
if (html.includes('Additional report · $79 one-time')) throw new Error('Corporate entity remediation validation failed: unnormalized Analyze Fit price remains.');
if ((html.match(/rel="preload" as="image" href="\/assets\/headquarters\.webp"/g) || []).length !== 1) throw new Error('Corporate performance remediation: hero preload must appear exactly once.');

fs.writeFileSync(file, html, 'utf8');

// Re-read the publish artifact after writing so a successful build cannot report
// PASS while leaving a stale public price in the actual file Netlify publishes.
const publishedHtml = fs.readFileSync(file, 'utf8');
if (!publishedHtml.includes('Additional report · $79.00 one-time')) throw new Error('Corporate post-write validation failed: authoritative Analyze Fit price missing from publish artifact.');
if (publishedHtml.includes('Additional report · $15 one-time')) throw new Error('Corporate post-write validation failed: stale $15 Analyze Fit price remains in publish artifact.');
if (publishedHtml.includes('Additional report · $49.99 one-time')) throw new Error('Corporate post-write validation failed: stale $49.99 Analyze Fit price remains in publish artifact.');
if ((publishedHtml.match(/rel="preload" as="image" href="\/assets\/headquarters\.webp"/g) || []).length !== 1) throw new Error('Corporate post-write validation failed: hero preload must appear exactly once in publish artifact.');

console.log('[corporate-search-entity] PASS — publish artifact has entity graph, Analyze Fit $79.00 pricing, and exactly-once hero preload.');
require('./apply-nonblocking-fonts.cjs');
