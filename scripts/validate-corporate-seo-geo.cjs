'use strict';
const fs = require('fs');
const requiredFiles = ['index.html','ecosystem.html','sitemap.xml'];
for (const file of requiredFiles) if (!fs.existsSync(file)) throw new Error('[corporate-seo-geo] missing ' + file);
const home = fs.readFileSync('index.html','utf8');
const ecosystem = fs.readFileSync('ecosystem.html','utf8');
const sitemap = fs.readFileSync('sitemap.xml','utf8');
const required = [
  [home, 'href="/ecosystem">Explore the APROPOS Ecosystem</a>', 'homepage ecosystem link'],
  [ecosystem, '<link rel="canonical" href="https://aproposgroupllc.com/ecosystem">', 'ecosystem canonical'],
  [ecosystem, 'Business Development Management System', 'BDMS entity'],
  [ecosystem, 'AI4 Contact Center', 'AI4 Contact Center entity'],
  [ecosystem, 'APROPOS Business Intelligence Marketplace', 'Marketplace entity'],
  [ecosystem, '"@type":"ItemList"', 'ItemList schema'],
  [sitemap, 'https://aproposgroupllc.com/ecosystem', 'ecosystem sitemap entry']
];
for (const [content, token, label] of required) if (!content.includes(token)) throw new Error('[corporate-seo-geo] missing ' + label);
if (/noindex/i.test((ecosystem.match(/<meta name="robots"[^>]*>/i)||[''])[0])) throw new Error('[corporate-seo-geo] ecosystem is noindex');
console.log('[corporate-seo-geo] VALID — corporate ecosystem page is canonical, indexable, internally linked, and in sitemap.');
