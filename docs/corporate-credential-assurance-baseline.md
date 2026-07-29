# APROPOS GROUP LLC — Corporate Credential Assurance Baseline

**Document ID:** NATCORP-OTF-WP1A-CP1A-R-CREDENTIAL-ASSURANCE-MATRIX-001  
**Baseline date:** July 29, 2026  
**Scope:** Public corporate website credential and contact assurance  
**Authoritative corporate URL:** https://aproposgroupllc.com/

This record is the maintenance baseline for public corporate credential information. Public statements must not be expanded from this matrix without authoritative evidence or Project Owner confirmation, as applicable.

| Credential | Public value | Authoritative source | Verification result | Date verified | Website location | Remediation performed | Final status |
|---|---|---|---|---|---|---|---|
| Legal business identity | APROPOS GROUP LLC | Nevada Secretary of State / SilverFlume entity record; Nevada State Business License | Legal entity name confirmed | 2026-07-29 | Home, navigation, footers, public pages | None required | PASS |
| Nevada entity type | Domestic Limited-Liability Company | Nevada Secretary of State / SilverFlume entity record | Confirmed | 2026-07-29 | Home credential presentation | None required | PASS |
| Nevada entity status | Active | Nevada Secretary of State / SilverFlume entity record | Confirmed | 2026-07-29 | Home credential presentation | None required | PASS |
| Nevada Business ID | NV20253463838 | Nevada Secretary of State / SilverFlume entity record and Nevada State Business License | Confirmed; prior website omitted leading `N` | 2026-07-29 | Home credential presentation | Production build normalization corrects `V20253463838` to `NV20253463838` | PASS |
| SAM.gov registration | Active | SAM.gov production activation notice dated 2026-07-22 | Confirmed active; annual renewal date 2027-07-21 | 2026-07-29 | Home credential presentation | None required | PASS |
| Unique Entity ID (UEI) | YVNXN3XBUSD5 | SAM.gov production activation notice | Confirmed | 2026-07-29 | Home, CTA/footer credential presentation | None required | PASS |
| CAGE code | 20UQ1 | SAM.gov production activation notice; DLA CAGE correspondence | Confirmed | 2026-07-29 | Home, CTA/footer credential presentation | None required | PASS |
| Federal Small Business representation | Currently published as Small Business | Current SAM.gov assertions / NAICS size representation required | Current registration is active, but the current detailed representation could not be independently retrieved in this checkpoint execution | 2026-07-29 | Home credential presentation | No unsupported change made | OPEN |
| Minority-owned self-identification | Currently published as minority-owned, self-identified in SAM | Current SAM.gov entity business-type / representations evidence required | Current detailed representation could not be independently retrieved in this checkpoint execution | 2026-07-29 | Home credential presentation | No unsupported change made | OPEN |
| NAICS codes | Website currently contains conflicting sets | Current SAM.gov `assertions.goodsAndServices.naicsList` / equivalent current registration evidence required | Authoritative current code set not independently retrievable in this checkpoint execution; no list inferred | 2026-07-29 | Home, Contact, Capabilities, Contract Vehicles and legacy source | No code set selected or fabricated pending authoritative evidence | OPEN |
| Official corporate email | jmitchell@aproposgroupllc.com | Project Owner confirmation, Jeff Mitchell, 2026-07-29 | Confirmed official public corporate email | 2026-07-29 | Home and active public HTML pages | Public HTML production build replaces `jmitchell1126@gmail.com`; backend contact-delivery workflow is intentionally unchanged | PASS |
| Official business telephone | (888) 244-5737 | Project Owner confirmation, Jeff Mitchell, 2026-07-29 | Confirmed official public business telephone | 2026-07-29 | Contact and applicable public pages/footers | Retained; no substitute introduced | PASS |
| Public location presentation | Las Vegas, Nevada | Nevada Secretary of State / SilverFlume record corroborates Nevada business location; public site intentionally uses city/state presentation | Corroborated at city/state level | 2026-07-29 | Home, Contact, footers | No private street-address expansion | PASS |
| Official website | https://aproposgroupllc.com/ | Project governance + Netlify production configuration | Authoritative apex domain confirmed | 2026-07-29 | Canonical metadata, sitemap, public pages | Existing WP1A canonicalization retained | PASS |

## Controlled exceptions

1. **NAICS reconciliation remains open.** The public website must not establish a single replacement NAICS set until current authoritative SAM.gov assertions are obtained.
2. **Small Business representation remains open for detailed independent assurance.** SAM.gov registration activation proves the entity registration is active, but does not itself enumerate the current NAICS size flags/representations.
3. **Minority-owned self-identification remains open for detailed independent assurance.** The public statement is not treated as independently verified until current SAM.gov business-type/representation evidence is obtained.
4. The Gmail address may remain in non-public operational delivery configuration where required for an active workflow; it is not the authoritative public corporate email.

## Change control

Future credential changes require one of the following:

- an authoritative issuing-government record, or
- explicit Project Owner confirmation for public corporate contact information.

Do not infer credentials from prior website copy, third-party directories, search snippets, marketing documents, or historical capability statements.
