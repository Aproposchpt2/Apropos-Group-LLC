'use strict';

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const homepage = path.join(root, 'index.html');
const ecosystemFile = path.join(root, 'ecosystem.html');
const sitemapFile = path.join(root, 'sitemap.xml');
const SITE = 'https://aproposgroupllc.com';
const TITLE = 'APROPOS Ecosystem | Business Development, AI Communications & Procurement Intelligence';
const DESCRIPTION = 'Explore the APROPOS Group LLC ecosystem: business development management, AI-powered communications, procurement intelligence, opportunity services, and business intelligence systems.';
const GA_ID = 'G-G643Z14JQ2';

const properties = [
  { name: 'APROPOS Business Intelligence Marketplace', alternateName: 'APROPOS Marketing Marketplace', url: 'https://marketplace.aproposgroupllc.com/', audience: 'Businesses, advisors, agencies, institutions, and organizations exploring APROPOS services', purpose: 'Public marketing, service discovery, education, and routing into the APROPOS operating ecosystem.' },
  { name: 'Business Development Management System', alternateName: 'BDMS', url: 'https://bdms.aproposgroupllc.com/', audience: 'Business Development Advisors and organizations that support business growth', purpose: 'Business-development management and contract-opportunity research workflows for advisor-led service delivery.' },
  { name: 'AI4 Contact Center', alternateName: 'AI4 Intelligent Contact Center', url: 'https://ai4contactcenter.aproposgroupllc.com/', audience: 'Businesses with meaningful inbound call volume', purpose: 'AI-powered voice management, call handling, routing, intake, lead capture, organization, and response workflow while the business keeps its existing number.' },
  { name: 'APROPOS Business Opportunity Agency', alternateName: 'ABOA', url: 'https://aproposopportunity.org/', audience: 'Businesses receiving or claiming APROPOS opportunity services', purpose: 'Public opportunity-service access and complimentary contract-opportunity pathways.' },
  { name: 'Registered Federal Contractors Portal', alternateName: 'RFCP', url: 'https://federalcontractorportal.aproposgroupllc.com/', audience: 'Businesses registered to pursue federal contracting opportunities', purpose: 'Federal contractor opportunity intelligence and guided access to relevant procurement pathways.' },
  { name: 'NAT-CORP Contract Exchange', alternateName: 'NAT-CORP', url: 'https://natcorp.aproposgroupllc.com/', audience: 'Licensed businesses pursuing state and local public-sector opportunities', purpose: 'State and local contract-opportunity access and contractor pathways.' },
  { name: 'National Enterprise Business Center', alternateName: 'NEBC', url: 'https://nebc.aproposgroupllc.com/', audience: 'Businesses working through assessment, readiness, and business-development needs', purpose: 'Business-development, readiness, planning, and support services.' }
];

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': ['Organization','Corporation'], '@id': SITE + '/#organization', name: 'APROPOS Group LLC', url: SITE + '/', areaServed: { '@type':'Country', name:'United States' }, location: { '@type':'Place', name:'Las Vegas, Nevada' } },
    { '@type': 'WebPage', '@id': SITE + '/ecosystem#webpage', url: SITE + '/ecosystem', name: TITLE, description: DESCRIPTION, about: { '@id': SITE + '/#organization' }, isPartOf: { '@id': SITE + '/#website' }, inLanguage: 'en-US' },
    { '@type': 'ItemList', name: 'APROPOS Group LLC operating ecosystem', numberOfItems: properties.length, itemListElement: properties.map((item,index)=>({ '@type':'ListItem', position:index+1, name:item.name, url:item.url })) },
    ...properties.map(item=>({ '@type':'Service', name:item.name, alternateName:item.alternateName, url:item.url, provider:{ '@id':SITE+'/#organization' }, description:item.purpose, audience:{ '@type':'Audience', audienceType:item.audience } }))
  ]
};

const cards = properties.map((item,index)=>`
<article class="ecosystem-card"><div class="num">${String(index+1).padStart(2,'0')}</div><h2>${item.name}</h2><p class="audience"><strong>Who it serves:</strong> ${item.audience}</p><p>${item.purpose}</p><a href="${item.url}" rel="noopener">Visit the operating site →</a></article>`).join('');

const html = `<!DOCTYPE html>
<html lang="en"><head>
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');</script>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${TITLE}</title><meta name="description" content="${DESCRIPTION}">
<link rel="canonical" href="${SITE}/ecosystem"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<meta property="og:type" content="website"><meta property="og:site_name" content="APROPOS Group LLC"><meta property="og:title" content="${TITLE}"><meta property="og:description" content="${DESCRIPTION}"><meta property="og:url" content="${SITE}/ecosystem"><meta property="og:image" content="${SITE}/og-apropos.jpg">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${TITLE}"><meta name="twitter:description" content="${DESCRIPTION}"><meta name="twitter:image" content="${SITE}/og-apropos.jpg">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<style>
:root{--navy:#0a1c3f;--navy2:#071426;--gold:#c6a052;--gold2:#ead49c;--paper:#f7f8fa;--ink:#132039;--muted:#586a84;--line:rgba(10,28,63,.16);font-family:Arial,Helvetica,sans-serif}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);line-height:1.7}a{color:inherit}.nav{background:var(--navy);color:#fff;padding:18px clamp(20px,5vw,72px);display:flex;justify-content:space-between;gap:20px;align-items:center}.brand{font-family:Georgia,serif;font-size:1.1rem;font-weight:700}.nav a{text-decoration:none}.nav-links{display:flex;gap:20px;flex-wrap:wrap;font-size:.78rem;text-transform:uppercase;letter-spacing:.08em;color:#d7dfec}.hero{background:linear-gradient(140deg,var(--navy2),var(--navy));color:#fff;padding:clamp(72px,9vw,120px) clamp(20px,6vw,92px)}.wrap{max-width:1180px;margin:0 auto}.eyebrow{color:var(--gold2);font-size:.72rem;font-weight:700;letter-spacing:.17em;text-transform:uppercase}.hero h1{font-family:Georgia,serif;font-size:clamp(2.6rem,5vw,5rem);line-height:1.03;margin:.7rem 0 1rem}.hero p{max-width:820px;color:#d8e0ed;font-size:1.1rem}.answer{margin-top:28px;padding:22px 24px;border-left:4px solid var(--gold);background:rgba(255,255,255,.06);max-width:900px}.section{padding:clamp(60px,7vw,96px) clamp(20px,5vw,72px)}.section h2{font-family:Georgia,serif;font-size:clamp(1.8rem,3vw,2.8rem);color:var(--navy);margin:.2rem 0 1rem}.lead{max-width:820px;color:var(--muted)}.grid,.qa{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:34px}.ecosystem-card{background:#fff;border:1px solid var(--line);padding:28px;border-radius:12px}.ecosystem-card .num{color:var(--gold);font-weight:700;letter-spacing:.12em}.ecosystem-card h2{font-size:1.55rem;margin:.5rem 0}.ecosystem-card p{color:var(--muted)}.ecosystem-card .audience{color:var(--ink)}.ecosystem-card a{display:inline-block;margin-top:10px;color:var(--navy);font-weight:700}.framework{background:#fff;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.qa article{padding:24px;border-left:3px solid var(--gold);background:var(--paper)}.qa h3{margin:0 0 8px;color:var(--navy);font-family:Georgia,serif}.cta{background:var(--navy);color:#fff;text-align:center}.cta h2{color:#fff}.btn{display:inline-block;margin:8px;padding:13px 20px;background:var(--gold);color:var(--navy);text-decoration:none;font-weight:700}.btn.secondary{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.35)}footer{padding:30px clamp(20px,5vw,72px);background:#061228;color:#b8c5d9;font-size:.84rem}@media(max-width:800px){.grid,.qa{grid-template-columns:1fr}.nav-links{display:none}}
</style></head><body>
<nav class="nav"><a class="brand" href="/">APROPOS GROUP LLC</a><div class="nav-links"><a href="/">Corporate</a><a href="/capabilities">Capabilities</a><a href="https://marketplace.aproposgroupllc.com/">Marketplace</a><a href="/contact">Contact</a></div></nav>
<header class="hero"><div class="wrap"><div class="eyebrow">Corporate Entity Reference · APROPOS Group LLC</div><h1>The APROPOS Ecosystem</h1><p>APROPOS Group LLC is the corporate authority behind a connected group of business-development, procurement-intelligence, opportunity-service, and AI-powered operating properties.</p><div class="answer"><strong>In plain terms:</strong> the Corporate site establishes who APROPOS is; the Business Intelligence Marketplace helps people discover the right service; the operating properties deliver the specialized workflow.</div></div></header>
<section class="section"><div class="wrap"><div class="eyebrow">Operating Architecture</div><h2>One company. Multiple focused service pathways.</h2><p class="lead">Each public property has a distinct role. This page is the human-readable entity reference for customers, search engines, and AI systems that need to understand how the APROPOS properties relate to one another.</p><div class="grid">${cards}</div></div></section>
<section class="section framework"><div class="wrap"><div class="eyebrow">How to interpret APROPOS</div><h2>What each layer does</h2><div class="qa"><article><h3>What is APROPOS Group LLC?</h3><p>The parent company and corporate authority for the ecosystem. Corporate capabilities, institutional relationships, business inquiries, and company-level information are anchored here.</p></article><article><h3>What is the Marketplace?</h3><p>The public marketing, education, and service-discovery layer. It helps visitors understand the available pathways and then routes them to the appropriate operating property.</p></article><article><h3>What are the operating properties?</h3><p>Focused applications and services designed around a specific business need, such as advisor-led business development, procurement intelligence, opportunity access, or AI-powered communications.</p></article><article><h3>Where does APROPOS serve customers?</h3><p>APROPOS Group LLC is based in Las Vegas, Nevada and serves customers and partners across the United States, subject to the scope and availability of each service.</p></article></div></div></section>
<section class="section cta"><div class="wrap"><h2>Start at the layer that matches your need.</h2><p>Use the Marketplace to explore services, or contact APROPOS Group LLC for corporate, institutional, partnership, and custom-system discussions.</p><a class="btn" href="https://marketplace.aproposgroupllc.com/">Explore the Marketplace</a><a class="btn secondary" href="/contact">Contact APROPOS Group LLC</a></div></section>
<footer>© 2026 APROPOS Group LLC · Las Vegas, Nevada · Independent private company. APROPOS is not a government agency and does not guarantee contract awards, funding, or commercial outcomes.</footer>
</body></html>`;

fs.writeFileSync(ecosystemFile, html, 'utf8');

if (fs.existsSync(homepage)) {
  let home = fs.readFileSync(homepage, 'utf8');
  home = home.replace('href="#ecosystem">Explore the APROPOS Ecosystem</a>', 'href="/ecosystem">Explore the APROPOS Ecosystem</a>');
  home = home.replace(/"name": "APROPOS Marketing Marketplace"/g, '"name": "APROPOS Business Intelligence Marketplace",\n      "alternateName": "APROPOS Marketing Marketplace"');
  fs.writeFileSync(homepage, home, 'utf8');
}
if (fs.existsSync(sitemapFile)) {
  let sitemap = fs.readFileSync(sitemapFile, 'utf8');
  const entry = '  <url><loc>' + SITE + '/ecosystem</loc><lastmod>2026-09-20</lastmod></url>\n';
  if (!sitemap.includes(SITE + '/ecosystem')) sitemap = sitemap.replace('</urlset>', entry + '</urlset>');
  fs.writeFileSync(sitemapFile, sitemap, 'utf8');
}
console.log('[corporate-seo-geo] PASS — ecosystem entity page, internal link, and sitemap entry applied.');
