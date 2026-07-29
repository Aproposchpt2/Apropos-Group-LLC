const fs = require('fs');
const path = require('path');

const root = process.cwd();
const authoritativeOrigin = 'https://aproposgroupllc.com';
const homepagePath = path.join(root, 'index.html');

function replaceCanonicalHost(filePath) {
  if (!fs.existsSync(filePath)) return;
  const original = fs.readFileSync(filePath, 'utf8');
  const updated = original.replace(
    /(<link\s+rel=["']canonical["']\s+href=["'])https:\/\/www\.aproposgroupllc\.com\//gi,
    `$1${authoritativeOrigin}/`
  );
  if (updated !== original) fs.writeFileSync(filePath, updated, 'utf8');
}

if (!fs.existsSync(homepagePath)) {
  throw new Error('Corporate homepage index.html was not found.');
}

let homepage = fs.readFileSync(homepagePath, 'utf8');

const startMarker = '<!-- APROPOS CORPORATE TRUST METADATA START -->';
const endMarker = '<!-- APROPOS CORPORATE TRUST METADATA END -->';
const managedBlockPattern = new RegExp(
  `${startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`,
  'm'
);

homepage = homepage.replace(managedBlockPattern, '');

const title = 'Apropos Group LLC — Procurement Intelligence & Technology Solutions';
const description = 'Apropos Group LLC develops procurement intelligence platforms, AI-powered software, strategic sourcing solutions, and enterprise technologies that help government agencies and businesses connect, compete, and grow.';
const image = `${authoritativeOrigin}/assets/headquarters.webp`;

const metadataBlock = `${startMarker}\n` +
`  <link rel="canonical" href="${authoritativeOrigin}/" />\n` +
`  <meta property="og:type" content="website" />\n` +
`  <meta property="og:site_name" content="Apropos Group LLC" />\n` +
`  <meta property="og:title" content="${title}" />\n` +
`  <meta property="og:description" content="${description}" />\n` +
`  <meta property="og:url" content="${authoritativeOrigin}/" />\n` +
`  <meta property="og:image" content="${image}" />\n` +
`  <meta name="twitter:card" content="summary_large_image" />\n` +
`  <meta name="twitter:title" content="${title}" />\n` +
`  <meta name="twitter:description" content="${description}" />\n` +
`  <meta name="twitter:image" content="${image}" />\n` +
`${endMarker}\n`;

const insertionPoint = /(<meta\s+name=["']theme-color["'][^>]*>\s*)/i;
if (!insertionPoint.test(homepage)) {
  throw new Error('Homepage theme-color metadata insertion point was not found.');
}

homepage = homepage.replace(insertionPoint, `$1\n  ${metadataBlock}`);
fs.writeFileSync(homepagePath, homepage, 'utf8');

[
  'capabilities.html',
  'contract-vehicles.html',
  'past-performance.html',
  'contact.html',
  'privacy.html',
  'terms.html'
].forEach((file) => replaceCanonicalHost(path.join(root, file)));

console.log('Corporate trust metadata prepared for production.');
