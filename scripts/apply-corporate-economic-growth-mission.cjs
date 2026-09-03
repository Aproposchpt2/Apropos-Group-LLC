'use strict';

const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'index.html');
let html = fs.readFileSync(file, 'utf8');

const START = '<!-- APROPOS_ECONOMIC_GROWTH_MISSION_START -->';
const END = '<!-- APROPOS_ECONOMIC_GROWTH_MISSION_END -->';
const TITLE = 'APROPOS Group LLC | Economic Growth Through Business Opportunity';
const DESCRIPTION = 'APROPOS Group LLC connects Federal and State public-sector opportunity with capable businesses so contracts can drive business revenue, job creation, and stronger communities.';
const ENTITY_DESCRIPTION = 'APROPOS Group LLC connects Federal and State public-sector opportunity with capable businesses through business-development and procurement intelligence services that support revenue growth, employment, and community prosperity.';

function mustReplace(from, to, label) {
  if (!html.includes(from)) throw new Error(`[corporate-mission] Missing ${label}`);
  html = html.replace(from, to);
}

function replaceTag(pattern, tag, label) {
  if (!pattern.test(html)) throw new Error(`[corporate-mission] Missing ${label}`);
  html = html.replace(pattern, tag);
}

// The existing corporate trust build owns the raw SEO baseline. This layer intentionally
// runs after that baseline and promotes the approved economic-growth mission.
replaceTag(/<title>[\s\S]*?<\/title>/i, `<title>${TITLE}</title>`, 'homepage title');
replaceTag(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${DESCRIPTION}" />`, 'meta description');
replaceTag(/<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${TITLE}" />`, 'Open Graph title');
replaceTag(/<meta\s+property=["']og:description["'][^>]*>/i, '<meta property="og:description" content="Connecting Federal and State public-sector opportunity with capable businesses to support revenue, employment, and community prosperity." />', 'Open Graph description');
replaceTag(/<meta\s+name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${TITLE}" />`, 'Twitter title');
replaceTag(/<meta\s+name=["']twitter:description["'][^>]*>/i, '<meta name="twitter:description" content="Connecting public-sector opportunity, business revenue, employment, and community prosperity." />', 'Twitter description');

// Update the primary corporate entity graph without disturbing the stable entity IDs or child-property graph.
const ldPattern = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i;
const ldMatch = html.match(ldPattern);
if (!ldMatch) throw new Error('[corporate-mission] Primary JSON-LD graph missing.');
try {
  const graph = JSON.parse(ldMatch[1]);
  if (Array.isArray(graph['@graph'])) {
    for (const node of graph['@graph']) {
      if (node['@id'] === 'https://aproposgroupllc.com/#organization') node.description = ENTITY_DESCRIPTION;
      if (node['@id'] === 'https://aproposgroupllc.com/#webpage') {
        node.name = TITLE;
        node.description = DESCRIPTION;
      }
    }
  }
  const updatedLd = `<script type="application/ld+json">\n${JSON.stringify(graph, null, 2)}\n  </script>`;
  html = html.replace(ldPattern, updatedLd);
} catch (error) {
  throw new Error(`[corporate-mission] JSON-LD update failed: ${error.message}`);
}

// Corporate navigation and approved homepage hero.
mustReplace(
  '<span class="brand-sub">Business Development &amp; Procurement Intelligence</span>',
  '<span class="brand-sub">Economic Growth Through Business Opportunity</span>',
  'brand subtitle'
);

const approvedHero = '<span class="eyebrow">Corporate Headquarters</span>\n      <h1>APROPOS GROUP LLC</h1>\n      <p class="hero-tagline">Dedicated to building ECONOMIC, BUSINESS, and COMMUNITY Growth.</p>\n      <p class="hero-copy"><strong>APROPOS Group LLC develops business-development and procurement intelligence platforms</strong> that help qualified businesses prepare for opportunity, identify relevant government contracts, understand requirements, and pursue growth with greater clarity.</p>';
const legacyHero = '<span class="eyebrow">APROPOS Group LLC Corporate Headquarters</span>\n      <h1>Opportunity Builds Business.<span>Business Builds Community.</span></h1>\n      <p class="hero-copy"><strong>APROPOS Group LLC develops business-development and procurement intelligence platforms</strong> that help qualified businesses prepare for opportunity, identify relevant government contracts, understand requirements, and pursue growth with greater clarity.</p>';
const priorMissionHero = '<span class="eyebrow">APROPOS Group LLC · Federal &amp; State Opportunity Infrastructure</span>\n      <h1>Business Opportunity Builds Economic Growth.<span>Economic Growth Builds Stronger Communities.</span></h1>\n      <p class="hero-copy"><strong>APROPOS Group LLC closes the gap between public-sector need and community prosperity.</strong> We help Federal and State entities reach capable businesses, help businesses find contract opportunities relevant to the services they provide, and support the economic activity that creates jobs, strengthens households, and expands opportunity across communities.</p>';

if (!html.includes(approvedHero)) {
  if (html.includes(legacyHero)) html = html.replace(legacyHero, approvedHero);
  else if (html.includes(priorMissionHero)) html = html.replace(priorMissionHero, approvedHero);
  else throw new Error('[corporate-mission] Missing approved hero mission');
}

// Preserve the current CTA if present; only normalize the prior mission CTA when encountered.
html = html.replace(
  '<a class="btn btn-primary" href="#economic-growth">See How the Mission Works</a>',
  '<a class="btn btn-primary" href="#ecosystem">Explore the APROPOS Ecosystem</a>'
);

// Replace the existing mission section with the governing economic-growth chain.
const missionStart = '<section class="band" id="mission">';
const ecosystemStart = '<section class="band" id="ecosystem" style="background:var(--paper-2)">';
const missionIndex = html.indexOf(missionStart);
const ecosystemIndex = html.indexOf(ecosystemStart);
if (missionIndex < 0 || ecosystemIndex < 0 || ecosystemIndex <= missionIndex) {
  throw new Error('[corporate-mission] Mission/ecosystem section boundaries not found.');
}

const mission = `${START}
    <section class="band economic-growth" id="economic-growth">
      <div class="wrap">
        <div class="section-head">
          <span class="eyebrow">The APROPOS Group LLC Mission</span>
          <h2>Start With Opportunity. Build Toward <em>Community Prosperity.</em></h2>
          <p>Economic growth is not an abstract outcome. It is a chain of practical events. Public entities have work that must be performed. Businesses need revenue-producing opportunities. People need meaningful employment. Communities become stronger when those parts connect. APROPOS Group LLC exists to help close the gaps between them.</p>
        </div>

        <div class="growth-chain" aria-label="APROPOS economic growth chain">
          <article class="growth-stage"><span>01 · Public Need</span><h3>Federal &amp; State Entities</h3><p>Public agencies procure goods and services to fulfill missions, operate programs, maintain infrastructure, and serve the public. Those needs create real business opportunities.</p><strong>APROPOS helps connect those opportunities with capable businesses.</strong></article>
          <article class="growth-stage"><span>02 · Business Revenue</span><h3>Businesses</h3><p>Businesses grow when they can consistently identify contract opportunities that are relevant to the services they actually provide.</p><strong>APROPOS helps businesses find and understand those opportunities.</strong></article>
          <article class="growth-stage"><span>03 · Employment</span><h3>People</h3><p>Revenue supports hiring, retained employment, wages, skill development, advancement, and greater financial stability for the people who live in our communities.</p><strong>Business growth creates pathways to gainful employment.</strong></article>
          <article class="growth-stage"><span>04 · Prosperity</span><h3>Communities</h3><p>Employment supports households. Stronger households support local spending, stability, resilience, and a broader foundation for long-term economic growth.</p><strong>Businesses grow. People prosper. Communities become stronger.</strong></article>
        </div>

        <div class="mission-principle">
          <span class="eyebrow">Closing the Gap</span>
          <p>APROPOS does not create the public need, the business capability, or the desire to work. Those already exist. <strong>Our service is the connective infrastructure:</strong> make relevant opportunity easier to discover, make the path to participation clearer, and help more of that public-sector economic activity reach businesses and the communities they employ.</p>
        </div>
      </div>
    </section>
${END}

    `;
html = html.slice(0, missionIndex) + mission + html.slice(ecosystemIndex);

// Reframe ecosystem copy around the mission without changing destinations, pricing, or application behavior.
html = html.replace(
  '<span class="eyebrow">Four Connected Pathways</span>\n          <h2>The APROPOS Business and Procurement <em>Ecosystem</em></h2>\n          <p>APROPOS Group LLC is the parent organization and corporate authority for an integrated ecosystem that routes each business, contractor, institution, and partner to the service pathway aligned with its needs.</p>',
  '<span class="eyebrow">Services Built Around the Mission</span>\n          <h2>Infrastructure That Moves Opportunity <em>Into the Economy</em></h2>\n          <p>APROPOS Group LLC is the parent organization and corporate authority for an integrated ecosystem designed to move from business readiness, to relevant contract discovery, to better procurement decisions, to business growth. Each property addresses a specific gap in that economic-growth chain.</p>'
);
html = html.replace(
  '<p>Personalized federal procurement intelligence for registered federal contractors.</p>',
  '<p>Federal contract discovery and procurement intelligence built specifically for registered federal contractors seeking opportunities published by Federal procurement agencies.</p>'
);
html = html.replace(
  '<p class="coverage">Built for businesses registered to pursue federal contracting opportunities.</p>',
  '<p class="coverage">Primary mission: help registered federal contractors find relevant Federal contract opportunities. Applicable State opportunity access can extend that opportunity reach.</p>'
);
html = html.replace(
  '<p>Personalized state and local procurement intelligence for licensed contractors.</p>',
  '<p>Business-first State and local public-sector contract discovery that starts with what a business provides and matches opportunity to demonstrated capability.</p>'
);

html = html.replace(
  '<h2>Expand Opportunity Through <em>Partnership</em></h2>\n          <p>APROPOS may work with institutions that share a commitment to business growth, supplier participation, workforce stability, and Community Economic Development.</p>',
  '<h2>Help More Public Opportunity Reach <em>Capable Businesses</em></h2>\n          <p>Federal, State, economic-development, workforce, education, and business-support institutions already work to expand participation and economic opportunity. APROPOS is designed to complement that work by strengthening the connection between public-sector demand, business capability, revenue opportunity, and employment.</p>'
);

html = html.replace(
  '<h2>Find the Right Business, Procurement, or <em>Partnership Pathway</em></h2>\n          <p>Connect with Jeffery Mitchell, Founder of APROPOS Group LLC, for corporate introductions, institutional partnerships, pilot discussions, capability briefings, and ecosystem inquiries.</p>',
  '<h2>Build More Opportunity Into the <em>Economic Growth Chain</em></h2>\n          <p>Connect with APROPOS Group LLC for Federal or State procurement modernization discussions, institutional partnerships, business-development initiatives, capability briefings, pilots, and programs designed to expand business participation and community economic opportunity.</p>'
);

const css = `
    /* APROPOS corporate economic-growth mission — Platinum institutional treatment */
    .economic-growth{position:relative;overflow:hidden;background:linear-gradient(180deg,#071426 0%,#0d2038 100%)!important}
    .economic-growth::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 85% 15%,rgba(200,155,60,.10),transparent 28%),linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:auto,72px 72px,72px 72px;pointer-events:none}
    .economic-growth .wrap{position:relative;z-index:1}
    .growth-chain{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:38px}
    .growth-stage{position:relative;min-height:330px;padding:28px 24px;border:1px solid rgba(200,155,60,.34);background:linear-gradient(160deg,rgba(16,36,61,.96),rgba(7,20,38,.96));border-radius:14px;box-shadow:0 20px 50px rgba(2,8,20,.24)}
    .growth-stage::after{content:"→";position:absolute;right:-16px;top:50%;transform:translateY(-50%);z-index:2;width:30px;height:30px;border:1px solid rgba(200,155,60,.38);border-radius:50%;display:grid;place-items:center;background:#071426;color:#e2b857;font-weight:700}
    .growth-stage:last-child::after{display:none}
    .growth-stage span{display:block;font-size:.61rem;font-weight:700;letter-spacing:.17em;text-transform:uppercase;color:#e2b857;margin-bottom:18px}
    .growth-stage h3{font-family:var(--display);font-size:1.55rem;color:#f5f7fa;line-height:1.14;margin-bottom:13px}
    .growth-stage p{color:#aab5c4;line-height:1.68}
    .growth-stage strong{display:block;margin-top:18px;padding-top:16px;border-top:1px solid rgba(200,155,60,.2);color:#f5f7fa;font-weight:500}
    .mission-principle{margin-top:22px;padding:30px;border-left:3px solid #c89b3c;background:rgba(255,255,255,.035);border-top:1px solid rgba(200,155,60,.18);border-right:1px solid rgba(200,155,60,.18);border-bottom:1px solid rgba(200,155,60,.18)}
    .mission-principle p{font-family:var(--serif);font-size:clamp(1.25rem,2.2vw,1.8rem);line-height:1.5;color:#d8e0eb;margin-top:13px}
    .mission-principle strong{color:#f5f7fa}
    @media(max-width:1020px){.growth-chain{grid-template-columns:1fr 1fr}.growth-stage:nth-child(2)::after{display:none}}
    @media(max-width:620px){.growth-chain{grid-template-columns:1fr}.growth-stage{min-height:0}.growth-stage::after{display:none}}
`;

if (!html.includes('APROPOS corporate economic-growth mission — Platinum institutional treatment')) {
  if (!html.includes('</style>')) throw new Error('[corporate-mission] Style closing tag missing.');
  html = html.replace('</style>', `${css}  </style>`);
}

fs.writeFileSync(file, html, 'utf8');
console.log('[corporate-mission] PASS — approved APROPOS hero, economic growth mission, Federal/State bridge, Platinum mission chain, and corporate search positioning applied.');
