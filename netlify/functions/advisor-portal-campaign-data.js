const crypto = require('crypto');

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0'
    },
    body: JSON.stringify(body)
  };
}

function env(name) {
  return process.env[name];
}

function safeError(error) {
  const message = error && error.message ? String(error.message) : String(error || 'Unknown error');
  return message.replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]').slice(0, 300);
}

async function supabase(path, params = '') {
  const base = env('SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY') || env('SUPABASE_SERVICE_KEY');
  if (!base || !key) throw new Error('Operations Supabase environment is not configured');
  const response = await fetch(`${base}/rest/v1/${path}${params ? `?${params}` : ''}`, {
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      accept: 'application/json'
    },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`${path} HTTP ${response.status}`);
  return response.json();
}

async function settle(name, work) {
  const started = Date.now();
  try {
    const value = await work();
    return { name, ok: true, value, latency_ms: Date.now() - started };
  } catch (error) {
    return { name, ok: false, error: safeError(error), latency_ms: Date.now() - started };
  }
}

const DAY = 86400000;
const QA_MARKERS = ['APROPOS QA SANDBOX', 'INTERNAL TEST SUBJECT'];
const upper = (value) => String(value || '').toUpperCase();
const isQaName = (value) => QA_MARKERS.some((marker) => upper(value).includes(marker));

exports.handler = async () => {
  const requestId = crypto.randomUUID();
  const generatedAt = new Date().toISOString();

  const [directoryResult, organizationsResult, outreachResult, evaluationsResult, contractsResult] = await Promise.all([
    settle('community_partnership_directory', () => supabase('community_partnership_directory', 'select=organization_id,agency_name,city,email,organization_type,source_status,is_active,created_at&order=created_at.desc&limit=2000')),
    settle('organizations', () => supabase('organizations', 'select=id,organization_name,organization_type,city,state,organization_status&limit=2000')),
    settle('outreach_messages', () => supabase('outreach_messages', 'select=organization_id,delivery_status,sent_at,recipient_email&order=sent_at.desc.nullslast&limit=2000')),
    settle('apropos_agency_evaluations', () => supabase('apropos_agency_evaluations', 'select=organization_id,agency_name,advisor_name,invited_at,first_login_at,evaluation_started_at,evaluation_ends_at,last_activity_at,evaluation_status,licensing_status&order=invited_at.desc.nullslast&limit=2000')),
    settle('bdms_contract_inventory', async () => {
      const response = await fetch('https://bdms.aproposgroupllc.com/api/campaign-contract-inventory', {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(12000)
      });
      if (!response.ok) throw new Error(`BDMS contract inventory HTTP ${response.status}`);
      const body = await response.json();
      if (!body?.ok) throw new Error(body?.error || 'BDMS contract inventory unavailable');
      return body;
    })
  ]);

  const sourceResults = [directoryResult, organizationsResult, outreachResult, evaluationsResult, contractsResult];
  const sourceStatus = Object.fromEntries(sourceResults.map((result) => [result.name, {
    ok: result.ok,
    latency_ms: result.latency_ms,
    error: result.ok ? null : result.error
  }]));

  const directory = directoryResult.ok ? (directoryResult.value || []) : [];
  const organizations = organizationsResult.ok ? (organizationsResult.value || []) : [];
  const outreachMessages = outreachResult.ok ? (outreachResult.value || []) : [];
  const evaluations = evaluationsResult.ok ? (evaluationsResult.value || []) : [];

  const orgById = new Map(organizations.map((row) => [row.id, row]));
  const directoryByOrgRaw = new Map();
  for (const row of directory) {
    if (!row.organization_id || row.is_active === false || directoryByOrgRaw.has(row.organization_id)) continue;
    directoryByOrgRaw.set(row.organization_id, row);
  }

  const evaluationByOrgRaw = new Map();
  for (const row of evaluations) {
    if (!row.organization_id || evaluationByOrgRaw.has(row.organization_id)) continue;
    evaluationByOrgRaw.set(row.organization_id, row);
  }

  const nameForOrg = (organizationId) => (
    directoryByOrgRaw.get(organizationId)?.agency_name ||
    evaluationByOrgRaw.get(organizationId)?.agency_name ||
    orgById.get(organizationId)?.organization_name ||
    ''
  );
  const isInternalQa = (organizationId) => isQaName(nameForOrg(organizationId));

  const directoryByOrg = new Map(
    [...directoryByOrgRaw.entries()].filter(([organizationId, row]) => !isInternalQa(organizationId) && !isQaName(row.agency_name))
  );

  const sentByOrg = new Map();
  if (outreachResult.ok) {
    for (const row of outreachMessages) {
      if (upper(row.delivery_status) !== 'SENT' || !row.organization_id || isInternalQa(row.organization_id)) continue;
      const prior = sentByOrg.get(row.organization_id);
      if (!prior || new Date(row.sent_at || 0) > new Date(prior.sent_at || 0)) sentByOrg.set(row.organization_id, row);
    }
  }

  const evaluationByOrg = new Map(
    [...evaluationByOrgRaw.entries()].filter(([organizationId, row]) => !isInternalQa(organizationId) && !isQaName(row.agency_name))
  );

  const organizationIds = new Set([
    ...directoryByOrg.keys(),
    ...sentByOrg.keys(),
    ...evaluationByOrg.keys()
  ]);

  const now = Date.now();
  const sevenDays = now + 7 * DAY;
  const agencyRows = [...organizationIds].map((organizationId) => {
    const directoryRow = directoryByOrg.get(organizationId) || {};
    const org = orgById.get(organizationId) || {};
    const sent = sentByOrg.get(organizationId);
    const evaluation = evaluationByOrg.get(organizationId);
    const start = evaluation?.evaluation_started_at || evaluation?.first_login_at || null;
    const end = evaluation?.evaluation_ends_at || (start ? new Date(new Date(start).getTime() + 30 * DAY).toISOString() : null);
    const endMs = end ? new Date(end).getTime() : null;
    const daysRemaining = endMs ? Math.max(0, Math.ceil((endMs - now) / DAY)) : null;

    let status = directoryByOrg.has(organizationId) ? 'READY_TO_EMAIL' : 'TRACKED';
    if (sent) status = 'INVITED';
    if (start && endMs && endMs >= now) status = endMs <= sevenDays ? 'EXPIRING' : 'ACTIVE_EVALUATION';
    if (start && endMs && endMs < now) status = 'EVALUATION_EXPIRED';
    if (evaluation?.evaluation_status && !['INVITED', 'ACTIVE_EVALUATION', 'EXPIRING'].includes(upper(evaluation.evaluation_status))) {
      status = upper(evaluation.evaluation_status);
    }

    return {
      organization_id: organizationId,
      agency_name: directoryRow.agency_name || evaluation?.agency_name || org.organization_name || 'Unnamed agency',
      organization_type: directoryRow.organization_type || org.organization_type || null,
      city: directoryRow.city || org.city || null,
      email: directoryRow.email || sent?.recipient_email || null,
      advisor_name: evaluation?.advisor_name || null,
      email_status: outreachResult.ok ? (sent ? 'SENT' : 'NOT_SENT') : 'UNKNOWN',
      invited_at: evaluation?.invited_at || sent?.sent_at || null,
      evaluation_started_at: start,
      evaluation_ends_at: end,
      days_remaining: daysRemaining,
      status
    };
  });

  const priority = { EXPIRING: 0, ACTIVE_EVALUATION: 1, INVITED: 2, READY_TO_EMAIL: 3, TRACKED: 4, EVALUATION_EXPIRED: 5 };
  agencyRows.sort((a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9) || a.agency_name.localeCompare(b.agency_name));

  const activeEvaluations = evaluationsResult.ok
    ? agencyRows.filter((row) => row.status === 'ACTIVE_EVALUATION' || row.status === 'EXPIRING').length
    : null;
  const expiring = evaluationsResult.ok
    ? agencyRows.filter((row) => row.status === 'EXPIRING').length
    : null;
  const agencyCount = directoryResult.ok ? directoryByOrg.size : null;
  const emailed = outreachResult.ok ? sentByOrg.size : null;
  const remaining = agencyCount != null && emailed != null ? Math.max(0, agencyCount - emailed) : null;
  const readyToEmail = directoryResult.ok && outreachResult.ok
    ? [...directoryByOrg.keys()].filter((organizationId) => !sentByOrg.has(organizationId)).length
    : null;

  const outreachUseful = directoryResult.ok || outreachResult.ok || evaluationsResult.ok;
  const outreachFailures = [directoryResult, outreachResult, evaluationsResult]
    .filter((result) => !result.ok)
    .map((result) => `${result.name}: ${result.error}`);

  const outreach = {
    ok: outreachUseful,
    partial: outreachFailures.length > 0,
    error: outreachUseful ? (outreachFailures.join('; ') || null) : 'OUTREACH_DATA_UNAVAILABLE',
    agency_count: agencyCount,
    emails_sent: emailed,
    agencies_remaining_to_email: remaining,
    ready_to_email: readyToEmail,
    active_evaluations: activeEvaluations,
    expiring_within_7_days: expiring,
    records: agencyRows,
    metric_sources: {
      agency_count: directoryResult.ok ? 'community_partnership_directory' : null,
      emails_sent: outreachResult.ok ? 'outreach_messages' : null,
      active_evaluations: evaluationsResult.ok ? 'apropos_agency_evaluations' : null,
      agency_register: outreachUseful ? 'best_effort_union' : null
    }
  };

  const contracts = contractsResult.ok
    ? { ...contractsResult.value, ok: true }
    : { ok: false, error: contractsResult.error || 'CONTRACT_INVENTORY_UNAVAILABLE' };

  const allPrimarySourcesOk = directoryResult.ok && outreachResult.ok && evaluationsResult.ok && contractsResult.ok;
  const anyOk = outreachUseful || contracts.ok;

  return json(anyOk ? 200 : 503, {
    ok: anyOk,
    partial: !allPrimarySourcesOk,
    request_id: requestId,
    generated_at: generatedAt,
    product: 'Advisor Contract Search Portal / BDMS',
    deployment: {
      commit_ref: env('COMMIT_REF') || null,
      deploy_id: env('DEPLOY_ID') || null,
      context: env('CONTEXT') || null
    },
    sources: sourceStatus,
    outreach,
    contracts
  });
};
