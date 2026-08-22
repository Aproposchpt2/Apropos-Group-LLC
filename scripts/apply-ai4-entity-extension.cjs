'use strict';
const fs=require('fs');
const file='index.html';
let html=fs.readFileSync(file,'utf8');
const match=html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
if(!match) throw new Error('AI4 entity extension: JSON-LD block not found.');
const data=JSON.parse(match[1]);
const graph=Array.isArray(data['@graph'])?data['@graph']:[];
const corporateId='https://aproposgroupllc.com/#organization';
const org=graph.find(node=>node&&node['@id']===corporateId);
if(!org) throw new Error('AI4 entity extension: APROPOS Organization node not found.');
org.brand=[
  {'@type':'Brand','@id':'https://ai4businesses.org/#brand',name:'AI4 Businesses',url:'https://ai4businesses.org/'},
  {'@type':'Brand','@id':'https://ai4websitedesign.com/#brand',name:'AI4 Website Design Studio',url:'https://ai4websitedesign.com/'}
];
const additions=[
  {'@type':'WebSite','@id':'https://ai4businesses.org/#website',url:'https://ai4businesses.org/',name:'AI4 Businesses',publisher:{'@id':corporateId},about:{'@id':'https://ai4businesses.org/#brand'}},
  {'@type':'Service','@id':'https://ai4businesses.org/#service',url:'https://ai4businesses.org/',name:'AI4 Businesses Automation Systems',serviceType:'Business workflow automation',provider:{'@id':corporateId},brand:{'@id':'https://ai4businesses.org/#brand'}},
  {'@type':'WebSite','@id':'https://ai4websitedesign.com/#website',url:'https://ai4websitedesign.com/',name:'AI4 Website Design Studio',inLanguage:'en-US',publisher:{'@id':corporateId},about:{'@id':'https://ai4websitedesign.com/#brand'}},
  {'@type':'WebSite','@id':'https://espanola.ai4websitedesign.com/#website',url:'https://espanola.ai4websitedesign.com/',name:'AI4 Website Design Studio — Español',inLanguage:'es',publisher:{'@id':corporateId},about:{'@id':'https://ai4websitedesign.com/#brand'}},
  {'@type':'WebApplication','@id':'https://ai4websitedesign.com/#application',url:'https://ai4websitedesign.com/',name:'AI4 Website Design Studio',applicationCategory:'DesignApplication',operatingSystem:'Web',provider:{'@id':corporateId},brand:{'@id':'https://ai4websitedesign.com/#brand'}}
];
for(const node of additions){if(!graph.some(existing=>existing&&existing['@id']===node['@id'])) graph.push(node);}
data['@graph']=graph;
const replacement=`<script type="application/ld+json">\n${JSON.stringify(data,null,2)}\n  </script>`;
html=html.replace(match[0],replacement);
const required=['https://ai4businesses.org/#brand','https://ai4businesses.org/#website','https://ai4websitedesign.com/#brand','https://ai4websitedesign.com/#website','https://espanola.ai4websitedesign.com/#website','https://ai4websitedesign.com/#application'];
for(const value of required) if(!html.includes(value)) throw new Error(`AI4 entity extension validation failed: missing ${value}`);
fs.writeFileSync(file,html,'utf8');
console.log('[corporate-ai4-entity] PASS — AI4 brands and public websites linked to APROPOS corporate authority.');
