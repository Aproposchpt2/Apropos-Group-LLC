'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const pagePath = path.join(ROOT, 'ai-procurement-modernization.html');
const capabilitiesPath = path.join(ROOT, 'capabilities.html');
const sitemapPath = path.join(ROOT, 'sitemap.xml');
const netlifyPath = path.join(ROOT, 'netlify.toml');
const canonicalUrl = 'https://aproposgroupllc.com/ai-procurement-modernization';
const failures = [];

for (const [label, file] of [['pillar page', pagePath], ['capabilities page', capabilitiesPath], ['sitemap', sitemapPath], ['netlify config', netlifyPath]]) {
  if (!fs.existsSync(file)) failures.push(`${label} missing: ${path.relative(ROOT, file)}`);
}

if (!failures.length) {
  let page = fs.readFileSync(pagePath, 'utf8');
  let capabilities = fs.readFileSync(capabilitiesPath, 'utf8');
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const netlify = fs.readFileSync(netlifyPath, 'utf8');

  const internalHref = '/ai-procurement-modernization';
  const existingInternalLink = new RegExp(`href=["']${internalHref}["']`, 'g');
  if (!existingInternalLink.test(capabilities)) {
    const marker = '<a class="btn-secondary" href="past-performance.html">View Past Performance</a>';
    if (!capabilities.includes(marker)) {
      failures.push('capabilities.html internal-link injection marker missing');
    } else {
      capabilities = capabilities.replace(marker, `${marker}\n      <a class="btn-secondary" href="${internalHref}">AI Procurement Modernization</a>`);
      fs.writeFileSync(capabilitiesPath, capabilities, 'utf8');
      capabilities = fs.readFileSync(capabilitiesPath, 'utf8');
    }
  }

  const requiredPageTokens = [
    `<link rel="canonical" href="${canonicalUrl}"`,
    '<meta name="robots" content="index,follow',
    '<h1>',
    'AI Procurement Modernization',
    'Acquisition workflow automation',
    'Procurement intelligence',
    'https://www.gsa.gov/artificial-intelligence/buy-ai',
    'https://www.gsa.gov/buy-through-us/explore-acquisition-options/featured-initiatives/procurement-automation-ecosystem',
    'https://www.gao.gov/products/gao-26-107859',
    'APROPOS Group LLC is an independent private company',
    'media="print" onload="this.media=\'all\'"',
    '<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?',
    '<link rel="preload" as="image" href="/assets/headquarters.webp" type="image/webp" fetchpriority="high" />'
  ];
  for (const token of requiredPageTokens) if (!page.includes(token)) failures.push(`pillar page missing required token: ${token}`);

  if (!/<title>[^<]{35,}<\/title>/i.test(page)) failures.push('pillar page title is missing or too short');
  if (!/<meta name="description" content="[^"]{120,}"/i.test(page)) failures.push('pillar page meta description is missing or too short');
  if (!/<h1>[\s\S]{25,}?<\/h1>/i.test(page)) failures.push('pillar page H1 is missing or too short');
  if (/\$(?:15(?:\.00)?|49\.99)\b/.test(page)) failures.push('obsolete Analyze Fit price found on pillar page');
  if (/\b(endorsed by|approved by|official partner of)\s+(?:the\s+)?(?:GSA|GAO|SAM\.gov|federal government)/i.test(page)) failures.push('pillar page contains prohibited government-affiliation language');

  const jsonLd = [...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  if (!jsonLd.length) failures.push('pillar page JSON-LD missing');
  for (const block of jsonLd) {
    try { JSON.parse(block[1]); }
    catch (error) { failures.push(`invalid pillar page JSON-LD: ${error.message}`); }
  }

  const heroPreloads = page.match(/rel="preload" as="image" href="\/assets\/headquarters\.webp"/g) || [];
  if (heroPreloads.length !== 1) failures.push(`pillar hero preload must appear exactly once; found ${heroPreloads.length}`);

  if (!new RegExp(`href=["']${internalHref}["']`).test(capabilities)) failures.push('capabilities.html does not link to AI procurement pillar');
  if (!sitemap.includes(`<loc>${canonicalUrl}</loc>`)) failures.push('sitemap missing AI procurement pillar');
  if (!netlify.includes('from = "/ai-procurement-modernization"')) failures.push('Netlify clean URL rule missing');
  if (!netlify.includes('to = "/ai-procurement-modernization.html"')) failures.push('Netlify pillar destination rule missing');

  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const duplicates = locs.filter((url, index) => locs.indexOf(url) !== index);
  if (duplicates.length) failures.push(`sitemap contains duplicate URLs: ${[...new Set(duplicates)].join(', ')}`);
}

if (failures.length) {
  console.error('[ai-procurement-pillar] Validation failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('[ai-procurement-pillar] PASS — canonical page, internal link, primary-source references, structured data, performance controls, sitemap and clean URL validated.');
