'use strict';

const fs = require('fs');
const path = require('path');

const pageFile = path.join('cime', 'index.html');
const registryFile = path.join('cime', 'marketing-program.json');
const registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
let html = fs.readFileSync(pageFile, 'utf8');

const START = '<!-- CIME_CURRENT_MARKETING_PROGRAM_START -->';
const END = '<!-- CIME_CURRENT_MARKETING_PROGRAM_END -->';

if (!html.includes('<meta name="robots" content="noindex,nofollow"')) {
  throw new Error('[cime-marketing] CIME noindex boundary is missing.');
}
if (!html.includes('https://www.linkedin.com/company/ai4businesses/')) {
  throw new Error('[cime-marketing] LinkedIn company-page target is missing.');
}

html = html
  .replace(
    'CIME discovers trends, generates professional conversation prompts, and publishes them to the AI For Businesses LinkedIn Page.',
    'CIME turns current APROPOS services and editorial content into professional LinkedIn conversations and publishes them to the AI For Businesses LinkedIn Page.'
  )
  .replace(
    'CIME discovers timely professional topics, creates concise questions people want to answer, publishes strategically, and learns from every conversation.',
    'CIME turns APROPOS expertise, current services, and owned editorial content into useful professional conversations that build awareness and route interested readers back to authoritative APROPOS pages.'
  )
  .replace(
    'Built to start conversations—not <em>broadcast advertisements.</em>',
    'Built to earn attention—not <em>broadcast advertisements.</em>'
  )
  .replace(
    'CIME finds the timely subject and asks the question that opens the door.',
    'CIME leads with useful insight, a credible question, or an APROPOS article—then gives interested readers a clear path to the relevant current service.'
  )
  .replace(
    'Detects relevant developments across AI, business, technology, procurement, and entrepreneurship.',
    'Combines current APROPOS priorities with timely developments across procurement, business growth, AI, technology, and entrepreneurship.'
  )
  .replace(
    'Transforms trends into recommendation requests, polls, rankings, comparisons, and experience prompts.',
    'Transforms current APROPOS expertise and article themes into questions, practical observations, comparisons, and experience prompts.'
  )
  .replace(
    'Publishes approved questions to the authorized AI For Businesses LinkedIn Page.',
    'Publishes approved conversations and article pathways to the authorized AI For Businesses LinkedIn Page.'
  )
  .replace(
    'Looking for recommendations. Which AI platform has become essential to your daily business operations?',
    'Government contracting is not one marketplace. Federal, state, local, and education buyers can use very different systems. Which public-sector market has been the hardest for your business to navigate? https://marketplace.aproposgroupllc.com/articles/federal-vs-state-local-government-contracts/'
  );

const cards = registry.properties.map((property, index) => `
  <article class="card">
    <span>${String(index + 1).padStart(2, '0')}</span>
    <h3>${property.name}</h3>
    <p>${property.focus}</p>
    <p><a href="${property.marketingUrl}" target="_blank" rel="noopener noreferrer">Marketing page →</a></p>
  </article>`).join('');

const programSection = `${START}
<section id="portfolio"><div class="wrap"><div class="head"><span class="eyebrow">Current Marketing Program</span><h2>One portfolio. One editorial source. <em>One current message.</em></h2><p>CIME uses the active APROPOS service portfolio below as its controlled LinkedIn subject inventory. Long-form educational content should originate on an APROPOS-owned page first, then be distributed through LinkedIn with a conversation-led introduction.</p></div><div class="cards">${cards}</div><div class="account-card" style="margin-top:18px"><div class="status-box"><h3>Publishing Standard</h3><p><strong>Article first when depth matters.</strong> Publish substantive educational material on the APROPOS Marketing Marketplace, then use LinkedIn to introduce the idea, invite professional discussion, and link readers back to the canonical article or current service page.</p><p><strong>Conversation first when engagement matters.</strong> Ask a useful question tied to procurement, business growth, AI, or digital presence without turning the company feed into repetitive advertisements.</p><p><strong>Retired services are prohibited.</strong> CIME's build validation rejects obsolete APROPOS names and domains from the active marketing program.</p><p><a class="button ghost" href="${registry.editorialHome}" target="_blank" rel="noopener noreferrer">Open Marketplace Articles</a></p></div></div></div></section>
${END}`;

if (html.includes(START)) {
  const pattern = new RegExp(`${START}[\\s\\S]*?${END}`);
  html = html.replace(pattern, programSection);
} else {
  const marker = '<section id="architecture">';
  if (!html.includes(marker)) throw new Error('[cime-marketing] Architecture insertion marker missing.');
  html = html.replace(marker, `${programSection}\n${marker}`);
}

const publicRegistry = {
  program: registry.program,
  version: registry.version,
  linkedinTarget: registry.linkedinTarget,
  editorialHome: registry.editorialHome,
  properties: registry.properties,
};
const registryScript = `<script id="cime-current-marketing-registry" type="application/json">${JSON.stringify(publicRegistry)}</script>`;
if (!html.includes('id="cime-current-marketing-registry"')) {
  html = html.replace('</body>', `${registryScript}\n</body>`);
}

fs.writeFileSync(pageFile, html, 'utf8');
console.log(`[cime-marketing] PASS — ${registry.properties.length} current APROPOS marketing themes applied; CIME remains noindex and LinkedIn publishing target is preserved.`);
