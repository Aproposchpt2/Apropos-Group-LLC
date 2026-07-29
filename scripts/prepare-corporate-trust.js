const fs = require('fs');
const path = require('path');

const root = process.cwd();
const authoritativeOrigin = 'https://aproposgroupllc.com';
const officialEmail = 'jmitchell@aproposgroupllc.com';
const verifiedNevadaBusinessId = 'NV20253463838';
const homepagePath = path.join(root, 'index.html');

const publicPages = [
  'index.html',
  'capabilities.html',
  'contract-vehicles.html',
  'past-performance.html',
  'contact.html',
  'privacy.html',
  'terms.html'
];

function normalizePublicIdentity(filePath) {
  if (!fs.existsSync(filePath)) return;
  const original = fs.readFileSync(filePath, 'utf8');
  let updated = original;

  // Project Owner confirmed the corporate-domain address as the authoritative
  // public email. This deliberately does not modify Netlify function delivery
  // addresses or other private/operational workflow configuration.
  updated = updated.replace(/jmitchell1126@gmail\.com/gi, officialEmail);

  // Nevada Secretary of State evidence identifies the NV Business ID with the
  // leading "N". Correct the previously published typographical omission.
  updated = updated.replace(/\bV20253463838\b/g, verifiedNevadaBusinessId);

  // The apex domain is the approved corporate authority. Normalize legacy WWW
  // canonical declarations on active public pages without changing route paths.
  updated = updated.replace(
    /(<link\s+rel=["']canonical["']\s+href=["'])https:\/\/www\.aproposgroupllc\.com\//gi,
    `$1${authoritativeOrigin}/`
  );

  if (updated !== original) fs.writeFileSync(filePath, updated, 'utf8');
}

publicPages.forEach((file) => normalizePublicIdentity(path.join(root, file)));

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

console.log('Corporate trust metadata and verified public identity prepared for production.');
