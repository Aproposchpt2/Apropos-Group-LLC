# APROPOS Message Horse — Inert Corporate Archive

Status: **ARCHIVED / NOT DEPLOYED / NOT SCHEDULED**

Archived: 2026-09-11
Owner: Apropos Group LLC

## Purpose

This directory preserves the APROPOS Message Horse runtime outside of the National Enterprise Business Center (NEBC). Message Horse had been hosted as a scheduled Netlify function in `Aproposchpt2/NATIONAL-ENTERPRISE-BUSINESS-CENTER`, even though it distributes messaging for the broader APROPOS property suite.

The runtime is intentionally stored here as an inert `.txt` source artifact. Nothing in this directory is a Netlify Function, and nothing here is scheduled to run.

## Original production source

Repository: `Aproposchpt2/NATIONAL-ENTERPRISE-BUSINESS-CENTER`

Original path: `netlify/functions/message-horse.js`

Verified production commit: `68b55fe2b8afda1e06567ece0f3951374253cf7e`

Original schedule: `0 15 * * *` — daily at 15:00 UTC.

## Archived source

`message-horse.js.disabled.txt`

This is intentionally **not** named `.js` and is intentionally **not** located under `netlify/functions/`.

## Future launch policy

Do not activate Message Horse merely by copying this file into a functions directory. A future launch should be an explicit Apropos Group corporate-site decision with its own validation and environment configuration.

Resources/configuration the home site will need at launch time:

- `ANTHROPIC_API_KEY`
- `MESSAGE_MODEL` (optional; source default was `claude-sonnet-4-6`)
- `MESSAGE_HORSE_MODE` (`paused`, `email`, `post`, or `both`)
- `FB_PAGE_ID`
- `FB_PAGE_TOKEN`
- `RESEND_API_KEY`
- `MESSAGE_RECIPIENT` or `RESEND_TO_EMAIL`
- `RESEND_FROM_EMAIL`

Before launch, validate all current APROPOS property names, canonical URLs, social destinations, Facebook permissions, Resend sender/recipient configuration, model selection, rate/cost controls, and the desired schedule.

## Safety control

The corporate archive is the preservation location only. The active NEBC scheduled runtime is to be removed so NEBC no longer owns or executes company-wide Message Horse distribution.
