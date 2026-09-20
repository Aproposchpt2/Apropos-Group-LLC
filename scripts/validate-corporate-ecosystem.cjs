'use strict';
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const pagePath = path.join(root, 'ecosystem.html');
const sitemapPath = path.join(root, 'sitemap.xml');

if (!fs.existsSync(pagePath)) throw new Error('[corporate-ecosystem] ecosystem.html missing.');
if (!fs.existsSync(sitemapPath)) throw new Error('[corporate-ecosystem] sitemap.xml missing.');

const page = fs.readFileSync(pagePath, 'utf8');
const sitemap = fs.readFileSync(sitemapPath, 'utf8');

const required = [
  '<title>APROPOS Ecosystem | Business Development, AI & Procurement Platforms</title>',
  'https://aproposgroupllc.com/ecosystem',
  'APROPOS Business Intelligence Marketplace',
  'Business Development Management System',
  'Advisor Contract Search Portal',
  'AI4 Contact Center',
  'APROPOS Business Opportunity Agency',
  'Registered Federal Contractors Portal',
  'NAT-CORP Contract Exchange',
  'National Enterprise Business Center',
  'https://marketplace.aproposgroupllc.com/',
  'https://bdms.aproposgroupllc.com/',
  'https://ai4contactcenter.aproposgroupllc.com/',
  'https://aproposopportunity.org/'
];
for (const token of required) {
  if (!page.includes(token)) throw new Error('[corporate-ecosystem] page missing: ' + token);
}
if (!sitemap.includes('https://aproposgroupllc.com/ecosystem')) {
  throw new Error('[corporate-ecosystem] sitemap missing ecosystem URL.');
}
if ((page.match(/<link rel="canonical"/g) || []).length !== 1) {
  throw new Error('[corporate-ecosystem] expected exactly one canonical.');
}
console.log('[corporate-ecosystem] PASS — public ecosystem reference, entity map, canonical and sitemap entry verified.');
