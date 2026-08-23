'use strict';

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join('cime', 'index.html'), 'utf8');
const registry = JSON.parse(fs.readFileSync(path.join('cime', 'marketing-program.json'), 'utf8'));
const failures = [];

for (const token of [
  '<meta name="robots" content="noindex,nofollow"',
  'CIME_CURRENT_MARKETING_PROGRAM_START',
  'Current Marketing Program',
  'One portfolio. One editorial source.',
  'id="cime-current-marketing-registry"',
  'https://www.linkedin.com/company/ai4businesses/',
  'https://marketplace.aproposgroupllc.com/articles/'
]) {
  if (!html.includes(token)) failures.push(`missing required CIME token: ${token}`);
}

if (registry.properties.length !== 8) failures.push(`expected 8 current marketing properties, found ${registry.properties.length}`);
for (const property of registry.properties) {
  for (const value of [property.name, property.marketingUrl, property.productionUrl]) {
    if (!html.includes(value)) failures.push(`CIME page missing current marketing registry value: ${value}`);
  }
}

for (const retired of registry.retiredTokens) {
  if (html.toLowerCase().includes(String(retired).toLowerCase())) failures.push(`retired marketing token present in CIME output: ${retired}`);
}

const publisher = fs.readFileSync(path.join('netlify', 'functions', 'linkedin-publish.js'), 'utf8');
for (const marker of ['https://api.linkedin.com/rest/posts', "urn:li:organization:", "visibility: 'PUBLIC'"]) {
  if (!publisher.includes(marker)) failures.push(`LinkedIn publisher contract missing: ${marker}`);
}

if (failures.length) {
  console.error('[cime-marketing] Validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('[cime-marketing] PASS — current eight-property portfolio, article-first editorial pathway, retired-service exclusion, noindex boundary, and LinkedIn organization publisher are intact.');
