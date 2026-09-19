'use strict';

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const homePath = path.join(root, 'index.html');
const capabilitiesPath = path.join(root, 'capabilities.html');

const services = [
  ['Business Intelligence Systems', 'Business intelligence systems that organize operational, customer, procurement, and decision-support information into usable business workflows.'],
  ['Custom Business Software Development', 'Custom business software designed around client operations, data flows, integrations, dashboards, and automation requirements.'],
  ['AI Contact Center Software Development', 'AI contact center software for conversational intake, routing, call handling, escalation, and customer interaction management.'],
  ['Business Workflow Automation', 'Workflow automation that connects intake, processing, notifications, approvals, data updates, and operational handoffs.'],
  ['CRM / Customer 360 Systems', 'Customer 360 and CRM systems that unify customer, lead, interaction, status, and relationship data for a complete operational view.'],
  ['Lead Management Systems', 'Lead management systems for capture, qualification, routing, alerts, follow-up, pipeline visibility, and conversion workflows.'],
  ['Procurement Intelligence Services', 'Procurement intelligence services that help organizations discover, organize, understand, and act on relevant public-sector contracting information.'],
  ['AI Voice Call Management', 'AI voice call management for answering, understanding, routing, capturing, and organizing inbound business calls.'],
  ['Business Development Management Systems', 'Business development management systems that support opportunity discovery, workflow control, advisor or staff operations, and business growth activity.'],
  ['Federal, State & Local Government Contract Procurement Systems', 'Procurement systems supporting discovery and management of Federal, State, and local government contract opportunities.']
];

function replaceTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

let home = fs.readFileSync(homePath, 'utf8');
const ldPattern = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i;
const homeLd = home.match(ldPattern);
if (!homeLd) throw new Error('[service-taxonomy] Homepage JSON-LD not found.');

const graphData = JSON.parse(homeLd[1]);
if (!Array.isArray(graphData['@graph'])) throw new Error('[service-taxonomy] Homepage JSON-LD graph missing.');
const org = graphData['@graph'].find(node => node['@id'] === 'https://aproposgroupllc.com/#organization');
if (!org) throw new Error('[service-taxonomy] Corporate organization entity missing.');

org.knowsAbout = services.map(([name]) => name);
org.makesOffer = services.map(([name, description], index) => ({
  '@type': 'Offer',
  '@id': `https://aproposgroupllc.com/#service-offer-${index + 1}`,
  itemOffered: {
    '@type': 'Service',
    '@id': `https://aproposgroupllc.com/capabilities#service-${index + 1}`,
    name,
    description,
    provider: { '@id': 'https://aproposgroupllc.com/#organization' },
    url: 'https://aproposgroupllc.com/capabilities'
  }
}));

home = home.replace(homeLd[0], `<script type="application/ld+json">\n${JSON.stringify(graphData, null, 2)}\n  </script>`);
fs.writeFileSync(homePath, home, 'utf8');

let capabilities = fs.readFileSync(capabilitiesPath, 'utf8');
const title = 'Business Intelligence, AI Automation & Procurement Systems | Apropos Group LLC';
const description = 'Apropos Group LLC provides business intelligence systems, custom business software, AI contact center development, workflow automation, CRM and Customer 360 systems, lead management, procurement intelligence, AI voice call management, business development management systems, and government contract procurement systems.';

capabilities = replaceTag(capabilities, /<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
capabilities = replaceTag(capabilities, /<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${description}" />`);
capabilities = replaceTag(capabilities, /<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${title}" />`);
capabilities = replaceTag(capabilities, /<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${description}" />`);
capabilities = replaceTag(capabilities, /<meta\s+name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${title}" />`);
capabilities = replaceTag(capabilities, /<meta\s+name=["']twitter:description["'][^>]*>/i, '<meta name="twitter:description" content="Business intelligence, AI automation, CRM, lead management, voice systems, and procurement intelligence from Apropos Group LLC." />');

const marker = '<!-- APROPOS_GOOGLE_BUSINESS_SERVICE_TAXONOMY -->';
if (!capabilities.includes(marker)) {
  const deploymentMarker = '<section class="section">\n  <div class="container">\n    <div class="section-eyebrow">Deployment Process</div>';
  if (!capabilities.includes(deploymentMarker)) throw new Error('[service-taxonomy] Capabilities insertion point missing.');

  const cards = services.map(([name, serviceDescription], index) => `
      <div class="cap-card" id="service-${index + 1}">
        <div class="cap-num">Service ${String(index + 1).padStart(2, '0')}</div>
        <h3>${name}</h3>
        <p class="desc">${serviceDescription}</p>
      </div>`).join('');

  const section = `
${marker}
<section class="section" id="business-services">
  <div class="container">
    <div class="section-eyebrow">Google Business Profile · Service Portfolio</div>
    <h2>Business Intelligence, Automation &amp; <em>Procurement Systems</em></h2>
    <p class="section-desc">Apropos Group LLC provides an integrated portfolio of business management consulting, software, AI communications, workflow automation, customer intelligence, and procurement systems. These service names align with the company's verified Google Business Profile so search engines, AI answer systems, and prospective clients encounter a consistent description of what Apropos provides.</p>
    <div class="cap-grid">${cards}
    </div>
  </div>
</section>

`;
  capabilities = capabilities.replace(deploymentMarker, section + deploymentMarker);
}

const serviceGraph = {
  '@context': 'https://schema.org',
  '@graph': services.map(([name, serviceDescription], index) => ({
    '@type': 'Service',
    '@id': `https://aproposgroupllc.com/capabilities#service-${index + 1}`,
    name,
    description: serviceDescription,
    serviceType: name,
    provider: { '@id': 'https://aproposgroupllc.com/#organization' },
    url: 'https://aproposgroupllc.com/capabilities'
  }))
};

const schemaMarker = '<!-- APROPOS_SERVICE_TAXONOMY_SCHEMA -->';
if (!capabilities.includes(schemaMarker)) {
  capabilities = capabilities.replace(
    '</head>',
    `  ${schemaMarker}\n  <script type="application/ld+json">\n${JSON.stringify(serviceGraph, null, 2)}\n  </script>\n</head>`
  );
}

fs.writeFileSync(capabilitiesPath, capabilities, 'utf8');
console.log('[service-taxonomy] PASS — Google Business Profile service taxonomy applied to SEO/GEO content and structured data.');
