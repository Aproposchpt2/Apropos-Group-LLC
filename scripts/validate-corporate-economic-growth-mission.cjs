'use strict';

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
const failures = [];
const requireText = (text, label) => { if (!html.includes(text)) failures.push(label); };
const forbid = (text, label) => { if (html.toLowerCase().includes(text.toLowerCase())) failures.push(label); };

requireText('<title>APROPOS Group LLC | Economic Growth Through Business Opportunity</title>', 'corporate mission title');
requireText('APROPOS_ECONOMIC_GROWTH_MISSION_START', 'economic growth mission marker');
requireText('Start With Opportunity. Build Toward <em>Community Prosperity.</em>', 'mission heading');
requireText('Federal &amp; State Entities', 'Federal and State public-entity stage');
requireText('02 · Business Revenue', 'business revenue stage');
requireText('03 · Employment', 'employment stage');
requireText('04 · Prosperity', 'community prosperity stage');
requireText('Businesses grow. People prosper. Communities become stronger.', 'mission outcome statement');
requireText('Federal contract discovery and procurement intelligence built specifically for registered federal contractors seeking opportunities published by Federal procurement agencies.', 'RFCP governing positioning');
requireText('Primary mission: help registered federal contractors find relevant Federal contract opportunities.', 'RFCP primary mission');
requireText('Business-first State and local public-sector contract discovery', 'NAT-CORP positioning');
requireText('https://federalcontractorportal.aproposgroupllc.com/', 'RFCP pathway');
requireText('https://natcorp.aproposgroupllc.com/', 'NAT-CORP pathway');
requireText('https://nebc.aproposgroupllc.com/', 'NEBC pathway');
requireText('https://marketplace.aproposgroupllc.com/', 'Marketplace pathway');
requireText('APROPOS is an independent private company and is not a government agency.', 'independent-company disclosure');
requireText('Additional report · $79.00 one-time', 'Analyze Fit price preserved');
requireText('/assets/headquarters.webp', 'corporate hero preserved');

// Approved homepage hero identity and composition.
requireText('<h1>APROPOS GROUP LLC</h1>', 'APROPOS hero site name');
requireText('Dedicated to building ECONOMIC, BUSINESS, and COMMUNITY Growth.', 'approved hero growth line');
requireText('<span class="eyebrow">Corporate Headquarters</span>', 'corporate headquarters eyebrow');
requireText('margin-left:clamp(24px,6vw,96px);margin-right:0', 'left-anchored hero composition');
forbid('Business Opportunity Builds Economic Growth.<span>Economic Growth Builds Stronger Communities.</span>', 'retired centered economic-growth hero');

// Provenance guard: SAM.gov may be referenced for registration/profile facts, but never as the source of APROPOS contract inventory.
forbid('contracts from SAM.gov', 'forbidden SAM.gov contract-source claim');
forbid('opportunities from SAM.gov', 'forbidden SAM.gov opportunity-source claim');
forbid('sourced from SAM.gov', 'forbidden SAM.gov source claim');
forbid('SAM.gov contract feed', 'forbidden SAM.gov feed claim');

if (failures.length) {
  console.error('[corporate-mission] FAIL');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(2);
}

console.log('[corporate-mission] PASS — approved hero identity/alignment, mission chain, RFCP/NAT-CORP boundaries, provenance guard, pricing, hero image, and corporate pathways validated.');
