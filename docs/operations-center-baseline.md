# Apropos Group Operations Center — Architecture Baseline

Status: Owner authorized

## Purpose
Provide one internal owner operating console for the entire Apropos Group technology and business-development operating environment.

## Operating layers
1. Company Operations — infrastructure, vendors, billing, API usage, domains, renewals, tax/expense evidence, incidents, access, backup/recovery.
2. System Operations — production sites, repositories, command centers, deployments, databases, email infrastructure, dependency mapping, system health.
3. Business Development Operations — agency targets, outreach, qualification, demos, evaluations, acquisition, onboarding, active agencies, usage, cost per agency, renewals, expansion.

## Governing principle
One owner view. One entry point. One operating console.

## Current implementation
- `/operations-center`
- live public endpoint health monitoring
- direct access to key production sites
- ACB and NAT-CORP command-center shortcuts
- infrastructure launchpad
- known fixed vendor-cost baseline
- business-development agency lifecycle shell

## Controlled next integrations
- OpenAI project usage, cost, runway, and threshold alerts
- vendor billing calendar and renewal dates
- agency acquisition ledger and activity metrics
- tax / expense evidence and annual export
- incident and dependency ledger
- deploy telemetry by site
- access / permissions and recovery register

## Security boundary
The Operations Center is intended for owner/internal operations. Secret values must never be displayed in the UI. Only secret location/inventory metadata may be shown.
