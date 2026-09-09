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
  return globalThis.Netlify?.env?.get ? Netlify.env.get(name) : process.env[name];
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
  if (!response.ok) throw new Error(`${path} ${response.status}`);
  return response.json();
}

const DAY = 86400000;

exports.handler = async () => {
  try {
    const [directory, organizations, outreach, evaluations, contractResponse] = await Promise.all([
      supabase('community_partnership_directory', 'select=organization_id,agency_name,city,email,organization_type,source_status,is_active,created_at&order=created_at.desc&limit=2000'),
      supabase('organizations', 'select=id,organization_name,organization_type,city,state,organization_status&limit=2000'),
      supabase('outreach_messages', 'select=organization_id,delivery_status,sent_at,recipient_email&order=sent_at.desc.nullslast&limit=2000'),
      supabase('apropos_agency_evaluations', 'select=organization_id,agency_name,advisor_name,invited_at,first_login_at,evaluation_started_at,evaluation_ends_at,last_activity_at,evaluation_status,licensing_status&order=invited_at.desc.nullslast&limit=2000'),
      fetch('https://bdms.aproposgroupllc.com/api/campaign-contract-inventory', { headers: { accept: 'application/json' } })
    ]);

    if (!contractResponse.ok) throw new Error(`BDMS contract inventory ${contractResponse.status}`);
    const contracts = await contractResponse.json();
    if (!contracts?.ok) throw new Error(contracts?.error || 'BDMS contract inventory unavailable');

    const orgById = new Map(organizations.map((row) => [row.id, row]));
    const isInternalQa = (organizationId) => {
      const name = String(orgById.get(organizationId)?.organization_name || '').toUpperCase();
      return name.includes('APROPOS QA SANDBOX') || name.includes('INTERNAL TEST SUBJECT');
    };

    const activeDirectory = directory.filter((row) => row.is_active !== false && row.organization_id && !isInternalQa(row.organization_id));
    const directoryByOrg = new Map();
    for (const row of activeDirectory) if (!directoryByOrg.has(row.organization_id)) directoryByOrg.set(row.organization_id, row);

    const sentRows = outreach.filter((row) => String(row.delivery_status || '').toUpperCase() === 'SENT' && row.organization_id && !isInternalQa(row.organization_id));
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

    return json(200, {
      ok: true,
      generated_at: new Date().toISOString(),
      product: 'Advisor Contract Search Portal / BDMS',
      outreach: {
        agency_count: agencyRows.length,
        emails_sent: emailed,
        agencies_remaining_to_email: Math.max(0, agencyRows.length - emailed),
        active_evaluations: activeEvaluations,
        expiring_within_7_days: expiring,
        records: agencyRows
      },
      contracts
    });
  } catch (error) {
    return json(500, {
      ok: false,
      error: 'ADVISOR_PORTAL_CAMPAIGN_DATA_UNAVAILABLE',
      message: error && error.message ? error.message : 'Unknown error'
    });
  }
};
