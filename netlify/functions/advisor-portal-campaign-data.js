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
    }
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

  let outreach = {
    ok: false,
    error: 'OUTREACH_DATA_UNAVAILABLE',
    agency_count: null,
    emails_sent: null,
    agencies_remaining_to_email: null,
    active_evaluations: null,
    expiring_within_7_days: null,
    records: []
  };

  if (directoryResult.ok && organizationsResult.ok && outreachResult.ok && evaluationsResult.ok) {
    try {
      const directory = directoryResult.value || [];
      const organizations = organizationsResult.value || [];
      const outreachMessages = outreachResult.value || [];
      const evaluations = evaluationsResult.value || [];

      const orgById = new Map(organizations.map((row) => [row.id, row]));
      const isInternalQa = (organizationId) => {
        const name = String(orgById.get(organizationId)?.organization_name || '').toUpperCase();
        return name.includes('APROPOS QA SANDBOX') || name.includes('INTERNAL TEST SUBJECT');
      };

      const activeDirectory = directory.filter((row) => row.is_active !== false && row.organization_id && !isInternalQa(row.organization_id));
      const directoryByOrg = new Map();
      for (const row of activeDirectory) if (!directoryByOrg.has(row.organization_id)) directoryByOrg.set(row.organization_id, row);

      const sentRows = outreachMessages.filter((row) => String(row.delivery_status || '').toUpperCase() === 'SENT' && row.organization_id && !isInternalQa(row.organization_id));
      const sentByOrg = new Map();
      for (const row of sentRows) {
        const prior = sentByOrg.get(row.organization_id);
        if (!prior || new Date(row.sent_at || 0) > new Date(prior.sent_at || 0)) sentByOrg.set(row.organization_id, row);
      }

      const evaluationByOrg = new Map();
      for (const row of evaluations) if (row.organization_id && !evaluationByOrg.has(row.organization_id)) evaluationByOrg.set(row.organization_id, row);

      const now = Date.now();
      const sevenDays = now + 7 * DAY;
      const agencyRows = [...directoryByOrg.entries()].map(([organizationId, directoryRow]) => {
        const org = orgById.get(organizationId) || {};
        const sent = sentByOrg.get(organizationId);
        const evaluation = evaluationByOrg.get(organizationId);
        const start = evaluation?.evaluation_started_at || evaluation?.first_login_at || null;
        const end = evaluation?.evaluation_ends_at || (start ? new Date(new Date(start).getTime() + 30 * DAY).toISOString() : null);
        const endMs = end ? new Date(end).getTime() : null;
        const daysRemaining = endMs ? Math.max(0, Math.ceil((endMs - now) / DAY)) : null;
        let status = 'READY_TO_EMAIL';
        if (sent) status = 'INVITED';
        if (start && endMs && endMs >= now) status = endMs <= sevenDays ? 'EXPIRING' : 'ACTIVE_EVALUATION';
        if (start && endMs && endMs < now) status = 'EVALUATION_EXPIRED';
        if (evaluation?.evaluation_status && !['INVITED','ACTIVE_EVALUATION','EXPIRING'].includes(String(evaluation.evaluation_status).toUpperCase())) status = String(evaluation.evaluation_status).toUpperCase();
        return {
          organization_id: organizationId,
          agency_name: directoryRow.agency_name || org.organization_name || 'Unnamed agency',
          organization_type: directoryRow.organization_type || org.organization_type || null,
          city: directoryRow.city || org.city || null,
          email: directoryRow.email || sent?.recipient_email || null,
          advisor_name: evaluation?.advisor_name || null,
          email_status: sent ? 'SENT' : 'NOT_SENT',
          invited_at: evaluation?.invited_at || sent?.sent_at || null,
          evaluation_started_at: start,
          evaluation_ends_at: end,
          days_remaining: daysRemaining,
          status
        };
      });

      const priority = { EXPIRING: 0, ACTIVE_EVALUATION: 1, INVITED: 2, READY_TO_EMAIL: 3, EVALUATION_EXPIRED: 4 };
      agencyRows.sort((a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9) || a.agency_name.localeCompare(b.agency_name));

      const activeEvaluations = agencyRows.filter((row) => row.status === 'ACTIVE_EVALUATION' || row.status === 'EXPIRING').length;
      const expiring = agencyRows.filter((row) => row.status === 'EXPIRING').length;
      const emailed = agencyRows.filter((row) => row.email_status === 'SENT').length;

      outreach = {
        ok: true,
        agency_count: agencyRows.length,
        emails_sent: emailed,
        agencies_remaining_to_email: Math.max(0, agencyRows.length - emailed),
        active_evaluations: activeEvaluations,
        expiring_within_7_days: expiring,
        records: agencyRows
      };
    } catch (error) {
      outreach.error = safeError(error);
    }
  } else {
    const failures = sourceResults
      .filter((result) => ['community_partnership_directory','organizations','outreach_messages','apropos_agency_evaluations'].includes(result.name) && !result.ok)
      .map((result) => `${result.name}: ${result.error}`);
    outreach.error = failures.join('; ') || outreach.error;
  }

  const contracts = contractsResult.ok
    ? { ...contractsResult.value, ok: true }
    : { ok: false, error: contractsResult.error || 'CONTRACT_INVENTORY_UNAVAILABLE' };

  const allOk = outreach.ok && contracts.ok;
  const anyOk = outreach.ok || contracts.ok;

  return json(anyOk ? 200 : 503, {
    ok: anyOk,
    partial: !allOk,
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
