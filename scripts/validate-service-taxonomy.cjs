'use strict';

const fs = require('fs');
const path = require('path');

const home = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
const capabilities = fs.readFileSync(path.join(process.cwd(), 'capabilities.html'), 'utf8');

const services = [
  'Business Intelligence Systems',
  'Custom Business Software Development',
  'AI Contact Center Software Development',
  'Business Workflow Automation',
  'CRM / Customer 360 Systems',
  'Lead Management Systems',
  'Procurement Intelligence Services',
  'AI Voice Call Management',
  'Business Development Management Systems',
  'Federal, State & Local Government Contract Procurement Systems'
];

for (const service of services) {
  if (!home.includes(service)) throw new Error(`[service-taxonomy] Homepage schema missing: ${service}`);
  if (!capabilities.includes(service)) throw new Error(`[service-taxonomy] Capabilities page missing: ${service}`);
}

if (!capabilities.includes('APROPOS_GOOGLE_BUSINESS_SERVICE_TAXONOMY')) throw new Error('[service-taxonomy] Visible service section marker missing.');
if (!capabilities.includes('APROPOS_SERVICE_TAXONOMY_SCHEMA')) throw new Error('[service-taxonomy] Service schema marker missing.');
if (!home.includes('"makesOffer"')) throw new Error('[service-taxonomy] Corporate makesOffer schema missing.');
if (!home.includes('"knowsAbout"')) throw new Error('[service-taxonomy] Corporate knowsAbout schema missing.');

console.log('[service-taxonomy] PASS — all 10 services present in visible content and structured data.');
