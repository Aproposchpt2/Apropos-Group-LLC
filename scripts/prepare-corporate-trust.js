const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = process.cwd();
const origin = 'https://aproposgroupllc.com';
const homepagePath = path.join(root, 'index.html');
const sitemapPath = path.join(root, 'sitemap.xml');
const robotsPath = path.join(root, 'robots.txt');
const socialImagePath = path.join(root, 'og-apropos.jpg');
const officialEmail = 'jmitchell@aproposgroupllc.com';
const verifiedNevadaBusinessId = 'NV20253463838';

const title = 'APROPOS Group LLC | Government Procurement Intelligence & AI';
const description = 'APROPOS Group LLC develops AI-powered government procurement intelligence, business-development platforms, contract opportunity matching, workflow automation, and technology solutions.';
const socialImage = `${origin}/og-apropos.jpg`;
const robots = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';

const publicPages = [
  ['index.html', '/'],
  ['capabilities.html', '/capabilities'],
  ['ai-procurement-modernization.html', '/ai-procurement-modernization'],
  ['contract-vehicles.html', '/contract-vehicles'],
  ['past-performance.html', '/past-performance'],
  ['contact.html', '/contact'],
  ['privacy.html', '/privacy'],
  ['terms.html', '/terms']
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setHeadTag(html, pattern, tag) {
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function normalizePublicIdentity(filePath) {
  if (!fs.existsSync(filePath)) return;
  const original = fs.readFileSync(filePath, 'utf8');
  let updated = original
    .replace(/jmitchell1126@gmail\.com/gi, officialEmail)
    .replace(/\bV20253463838\b/g, verifiedNevadaBusinessId)
    .replace(/https:\/\/www\.aproposgroupllc\.com\//gi, `${origin}/`);
  if (updated !== original) fs.writeFileSync(filePath, updated, 'utf8');
}

function schemaGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: 'APROPOS Group LLC',
        legalName: 'APROPOS Group LLC',
        url: `${origin}/`,
        description,
        logo: {
          '@type': 'ImageObject',
          url: `${origin}/assets/apropos-logo.png`
        },
        identifier: [
          { '@type': 'PropertyValue', name: 'Unique Entity ID', value: 'YVNXN3XBUSD5' },
          { '@type': 'PropertyValue', name: 'CAGE Code', value: '20UQ1' }
        ],
        areaServed: { '@type': 'Country', name: 'United States' },
        subOrganization: [
          { '@type': 'Organization', name: 'National Enterprise Business Center', url: 'https://nebc.aproposgroupllc.com/' },
          { '@type': 'Organization', name: 'Registered Federal Contractors Portal', url: 'https://federalcontractorportal.aproposgroupllc.com/' },
          { '@type': 'Organization', name: 'NAT-CORP Contract Exchange', url: 'https://natcorp.aproposgroupllc.com/' },
          { '@type': 'Organization', name: 'APROPOS Marketing Marketplace', url: 'https://marketplace.aproposgroupllc.com/' }
        ]
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: `${origin}/`,
        name: 'APROPOS Group LLC',
        publisher: { '@id': `${origin}/#organization` }
      },
      {
        '@type': 'WebPage',
        '@id': `${origin}/#webpage`,
        url: `${origin}/`,
        name: title,
        description,
        isPartOf: { '@id': `${origin}/#website` },
        about: { '@id': `${origin}/#organization` }
      }
    ]
  };
}

function applyHomepageSeo() {
  let html = fs.readFileSync(homepagePath, 'utf8');
  html = setHeadTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  html = setHeadTag(html, /<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${description}" />`);
  html = setHeadTag(html, /<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${origin}/" />`);
  html = setHeadTag(html, /<meta\s+name=["']robots["'][^>]*>/i, `<meta name="robots" content="${robots}" />`);
  html = setHeadTag(html, /<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${title}" />`);
  html = setHeadTag(html, /<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${description}" />`);
  html = setHeadTag(html, /<meta\s+property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${origin}/" />`);
  html = setHeadTag(html, /<meta\s+property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${socialImage}" />`);
  html = setHeadTag(html, /<meta\s+name=["']twitter:card["'][^>]*>/i, '<meta name="twitter:card" content="summary_large_image" />');
  html = setHeadTag(html, /<meta\s+name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${title}" />`);
  html = setHeadTag(html, /<meta\s+name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${description}" />`);
  html = setHeadTag(html, /<meta\s+name=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${socialImage}" />`);

  const jsonLd = `<script type="application/ld+json">\n${JSON.stringify(schemaGraph(), null, 2)}\n  </script>`;
  const ldPattern = /<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi;
  if (ldPattern.test(html)) html = html.replace(ldPattern, jsonLd);
  else html = html.replace(/<\/head>/i, `  ${jsonLd}\n</head>`);

  fs.writeFileSync(homepagePath, html, 'utf8');
}

function writeCrawlFiles() {
  fs.writeFileSync(robotsPath, `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`, 'utf8');
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = publicPages
    .filter(([file]) => fs.existsSync(path.join(root, file)))
    .map(([, route]) => `  <url>\n    <loc>${origin}${route}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join('\n');
  fs.writeFileSync(sitemapPath, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, 'utf8');
}

function validateHomepage() {
  const html = fs.readFileSync(homepagePath, 'utf8');
  const required = [title, description, `${origin}/#organization`, `${origin}/#website`, `${origin}/#webpage`, 'YVNXN3XBUSD5', '20UQ1'];
  for (const value of required) {
    if (!html.includes(value)) throw new Error(`Corporate SEO validation failed: missing ${value}`);
  }
  const titleMatches = html.match(/<title>/gi) || [];
  const canonicalMatches = html.match(/rel=["']canonical["']/gi) || [];
  if (titleMatches.length !== 1 || canonicalMatches.length !== 1) throw new Error('Corporate SEO validation failed: duplicate title or canonical tag.');
}

async function generateSocialImage() {
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#071936"/><stop offset="1" stop-color="#102d61"/></linearGradient></defs><rect width="1200" height="630" fill="url(#bg)"/><circle cx="145" cy="150" r="76" fill="#091d40" stroke="#c6a052" stroke-width="5"/><text x="145" y="170" text-anchor="middle" font-family="Georgia,serif" font-size="58" font-weight="700" fill="#e8cf94">AG</text><text x="260" y="138" font-family="Georgia,serif" font-size="62" font-weight="700" fill="#fff">APROPOS GROUP LLC</text><text x="263" y="178" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="4" fill="#e8cf94">GOVERNMENT PROCUREMENT INTELLIGENCE &amp; AI</text><rect x="82" y="255" width="1036" height="3" fill="#c6a052"/><text x="82" y="355" font-family="Arial,sans-serif" font-size="52" font-weight="700" fill="#e8cf94">Government Procurement Intelligence</text><text x="82" y="425" font-family="Arial,sans-serif" font-size="52" font-weight="700" fill="#fff">Business Development &amp; AI</text><text x="84" y="500" font-family="Arial,sans-serif" font-size="24" fill="#d4deef">Opportunity matching, workflow automation, and technology solutions.</text></svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true }).toFile(socialImagePath);
  const metadata = await sharp(socialImagePath).metadata();
  if (metadata.width !== 1200 || metadata.height !== 630) throw new Error('Corporate social image validation failed.');
}

async function main() {
  publicPages.forEach(([file]) => normalizePublicIdentity(path.join(root, file)));
  if (!fs.existsSync(homepagePath)) throw new Error('Corporate homepage index.html was not found.');
  applyHomepageSeo();
  writeCrawlFiles();
  validateHomepage();
  await generateSocialImage();
  console.log('Corporate SEO production setup applied and validated.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
