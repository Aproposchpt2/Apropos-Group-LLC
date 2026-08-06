const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = process.cwd();
const authoritativeOrigin = 'https://aproposgroupllc.com';
const officialEmail = 'jmitchell@aproposgroupllc.com';
const verifiedNevadaBusinessId = 'NV20253463838';
const homepagePath = path.join(root, 'index.html');
const socialImagePath = path.join(root, 'og-apropos.jpg');

const authoritativeTitle = 'APROPOS Group LLC | Business Development and Procurement Intelligence';
const authoritativeDescription = 'APROPOS Group LLC develops business-development and procurement intelligence platforms that expand access to opportunity and support community economic development.';
const authoritativeSocialImage = `${authoritativeOrigin}/og-apropos.jpg`;

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

  updated = updated.replace(/jmitchell1126@gmail\.com/gi, officialEmail);
  updated = updated.replace(/\bV20253463838\b/g, verifiedNevadaBusinessId);
  updated = updated.replace(
    /(<link\s+rel=["']canonical["']\s+href=["'])https:\/\/www\.aproposgroupllc\.com\//gi,
    `$1${authoritativeOrigin}/`
  );

  if (updated !== original) fs.writeFileSync(filePath, updated, 'utf8');
}

function removeLegacyManagedMetadata(homepage) {
  const startMarker = '<!-- APROPOS CORPORATE TRUST METADATA START -->';
  const endMarker = '<!-- APROPOS CORPORATE TRUST METADATA END -->';
  const managedBlockPattern = new RegExp(
    `${startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`,
    'gm'
  );
  return homepage.replace(managedBlockPattern, '');
}

function assertSingleMatch(homepage, pattern, label) {
  const matches = homepage.match(pattern) || [];
  if (matches.length !== 1) {
    throw new Error(`${label} must appear exactly once; found ${matches.length}.`);
  }
}

function validateHomepageMetadata(homepage) {
  assertSingleMatch(
    homepage,
    /<title>APROPOS Group LLC \| Business Development and Procurement Intelligence<\/title>/g,
    'Authoritative title'
  );
  assertSingleMatch(
    homepage,
    /<meta\s+name=["']description["']\s+content=["']APROPOS Group LLC develops business-development and procurement intelligence platforms that expand access to opportunity and support community economic development\.["']\s*\/?\s*>/g,
    'Authoritative meta description'
  );
  assertSingleMatch(
    homepage,
    /<link\s+rel=["']canonical["']\s+href=["']https:\/\/aproposgroupllc\.com\/["']\s*\/?\s*>/g,
    'Canonical URL'
  );
  assertSingleMatch(
    homepage,
    /<meta\s+name=["']robots["']\s+content=["']index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1["']\s*\/?\s*>/g,
    'Robots directive'
  );
  assertSingleMatch(homepage, /<meta\s+property=["']og:title["']/g, 'Open Graph title');
  assertSingleMatch(homepage, /<meta\s+property=["']og:description["']/g, 'Open Graph description');
  assertSingleMatch(homepage, /<meta\s+property=["']og:image["']/g, 'Open Graph image');
  assertSingleMatch(homepage, /<meta\s+name=["']twitter:card["']/g, 'Twitter card');
  assertSingleMatch(homepage, /<meta\s+name=["']twitter:image["']/g, 'Twitter image');
  assertSingleMatch(homepage, /<h1(?:\s|>)/gi, 'Homepage H1');

  if (!homepage.includes(`content="${authoritativeSocialImage}"`)) {
    throw new Error('Authoritative social-image URL is missing from homepage metadata.');
  }

  const jsonLdMatch = homepage.match(
    /<script\s+type=["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/i
  );
  if (!jsonLdMatch) throw new Error('Homepage JSON-LD block was not found.');

  const structuredData = JSON.parse(jsonLdMatch[1]);
  const graph = Array.isArray(structuredData['@graph']) ? structuredData['@graph'] : [];
  const organization = graph.find((entry) => entry['@type'] === 'Organization');
  const website = graph.find((entry) => entry['@type'] === 'WebSite');

  if (!organization || organization['@id'] !== `${authoritativeOrigin}/#organization`) {
    throw new Error('Organization schema is missing or has an invalid @id.');
  }
  if (organization.logo?.url !== `${authoritativeOrigin}/assets/apropos-logo.png`) {
    throw new Error('Organization schema logo URL is invalid.');
  }
  if (!website || website.publisher?.['@id'] !== organization['@id']) {
    throw new Error('WebSite schema publisher relationship is invalid.');
  }
}

async function generateSocialImage() {
  const svg = `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#071936"/>
        <stop offset="0.58" stop-color="#0a214a"/>
        <stop offset="1" stop-color="#102d61"/>
      </linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#8a6a24"/>
        <stop offset="0.5" stop-color="#c6a052"/>
        <stop offset="1" stop-color="#e8cf94"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#background)"/>
    <path d="M0 0H1200V630H0Z" fill="none" stroke="#c6a052" stroke-opacity="0.24" stroke-width="2"/>
    <path d="M720 0L1200 0L1200 630L970 630Z" fill="#ffffff" fill-opacity="0.025"/>
    <g opacity="0.16" stroke="#ffffff">
      <path d="M760 90H1120"/><path d="M760 130H1120"/><path d="M760 170H1120"/>
      <path d="M820 40V590"/><path d="M900 40V590"/><path d="M980 40V590"/><path d="M1060 40V590"/>
    </g>
    <circle cx="145" cy="150" r="76" fill="#091d40" stroke="url(#gold)" stroke-width="5"/>
    <circle cx="145" cy="150" r="64" fill="none" stroke="#c6a052" stroke-opacity="0.38" stroke-width="1"/>
    <text x="145" y="170" text-anchor="middle" font-family="Georgia, serif" font-size="58" font-weight="700" fill="#e8cf94">AG</text>
    <text x="260" y="138" font-family="Georgia, serif" font-size="62" font-weight="700" letter-spacing="1.5" fill="#ffffff">APROPOS GROUP LLC</text>
    <text x="263" y="178" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="5" fill="#e8cf94">PROCUREMENT INTELLIGENCE &amp; TECHNOLOGY SOLUTIONS</text>
    <rect x="82" y="255" width="1036" height="3" fill="url(#gold)"/>
    <text x="82" y="352" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="#e8cf94">Business Development and</text>
    <text x="82" y="422" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="#ffffff">Procurement Intelligence</text>
    <text x="84" y="492" font-family="Arial, sans-serif" font-size="25" font-weight="400" letter-spacing="0.4" fill="#d4deef">Expanding access to opportunity and supporting community economic development.</text>
    <rect x="82" y="548" width="118" height="5" fill="#c6a052"/>
    <text x="220" y="557" font-family="Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="3.5" fill="#8ea3c4">APROPOSGROUPLLC.COM</text>
  </svg>`;

  await sharp(Buffer.from(svg))
    .jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toFile(socialImagePath);

  const metadata = await sharp(socialImagePath).metadata();
  if (metadata.format !== 'jpeg' || metadata.width !== 1200 || metadata.height !== 630) {
    throw new Error('Generated social image failed JPEG or 1200 × 630 validation.');
  }
}

async function main() {
  publicPages.forEach((file) => normalizePublicIdentity(path.join(root, file)));

  if (!fs.existsSync(homepagePath)) {
    throw new Error('Corporate homepage index.html was not found.');
  }

  const originalHomepage = fs.readFileSync(homepagePath, 'utf8');
  const homepage = removeLegacyManagedMetadata(originalHomepage);
  if (homepage !== originalHomepage) fs.writeFileSync(homepagePath, homepage, 'utf8');

  validateHomepageMetadata(homepage);
  await generateSocialImage();

  console.log('Corporate metadata validated and 1200 × 630 social image generated for production.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
