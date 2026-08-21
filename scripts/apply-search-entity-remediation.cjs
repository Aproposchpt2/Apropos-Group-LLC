'use strict';

const fs = require('fs');

const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');

// One authoritative Analyze Fit price across the APROPOS ecosystem.
html = html.replaceAll('Additional report · $15 one-time', 'Additional report · $79 one-time');

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

const required = [
  'Additional report · $79 one-time',
  'https://federalcontractorportal.aproposgroupllc.com/#organization',
  'https://natcorp.aproposgroupllc.com/#organization',
  'https://nebc.aproposgroupllc.com/#organization',
  'https://marketplace.aproposgroupllc.com/#organization',
  'National Government Contract Center',
  'jmitchell@aproposgroupllc.com'
];
for (const value of required) if (!html.includes(value)) throw new Error(`Corporate entity remediation validation failed: missing ${value}`);
if (html.includes('Additional report · $15 one-time')) throw new Error('Corporate entity remediation validation failed: stale Analyze Fit price remains.');

fs.writeFileSync(file, html, 'utf8');
console.log('[corporate-search-entity] PASS — corporate entity graph and pricing are consistent.');
