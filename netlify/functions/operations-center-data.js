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

async function supabase(path, params = '') {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) throw new Error('Supabase server environment is not configured');
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

function sum(rows, field) {
  return rows.reduce((total, row) => total + Number(row[field] || 0), 0);
}

exports.handler = async () => {
  try {
    const [systems, vendors, usage, evaluations, incidents] = await Promise.all([
      supabase('apropos_systems', 'select=system_key,system_name,production_url,repository_full_name,command_center_url,hosting_provider,status,openai_dependent&order=system_name.asc'),
      supabase('apropos_vendors', 'select=vendor_key,vendor_name,service_category,billing_cadence,fixed_monthly_cost,autopay,account_status,verification_status,billing_day,renewal_date&order=vendor_name.asc'),
      supabase('apropos_openai_usage', 'select=usage_date,request_count,input_tokens,output_tokens,total_tokens,estimated_cost,failure_count&order=usage_date.desc&limit=400'),
      supabase('apropos_agency_evaluations', 'select=id,agency_name,advisor_name,promo_code,invited_at,evaluation_started_at,evaluation_ends_at,last_activity_at,evaluation_status,licensing_status&order=created_at.desc&limit=200'),
      supabase('apropos_incidents', 'select=id,incident_key,system_key,severity,category,status,summary,detected_at,resolved_at&order=detected_at.desc&limit=100')
    ]);

    const fixedMonthly = vendors.reduce((total, row) => total + Number(row.fixed_monthly_cost || 0), 0);
    const openIncidents = incidents.filter((row) => !['RESOLVED', 'CLOSED'].includes(String(row.status || '').toUpperCase()));
    const activeEvaluations = evaluations.filter((row) => ['ACTIVE_EVALUATION', 'EXPIRING'].includes(String(row.evaluation_status || '').toUpperCase()));
    const expiringEvaluations = evaluations.filter((row) => String(row.evaluation_status || '').toUpperCase() === 'EXPIRING');

    const usageSummary = {
      request_count: sum(usage, 'request_count'),
      input_tokens: sum(usage, 'input_tokens'),
      output_tokens: sum(usage, 'output_tokens'),
      total_tokens: sum(usage, 'total_tokens'),
      estimated_cost: Number(sum(usage, 'estimated_cost').toFixed(6)),
      failure_count: sum(usage, 'failure_count')
    };

    return json(200, {
      generated_at: new Date().toISOString(),
      systems,
      vendors,
      costs: {
        fixed_monthly: Number(fixedMonthly.toFixed(2)),
        annual_fixed_run_rate: Number((fixedMonthly * 12).toFixed(2))
      },
      openai: {
        summary: usageSummary,
        records: usage
      },
      agencies: {
        total: evaluations.length,
        active: activeEvaluations.length,
        expiring: expiringEvaluations.length,
        records: evaluations
      },
      incidents: {
        open: openIncidents.length,
        records: incidents
      }
    });
  } catch (error) {
    return json(500, {
      error: 'OPERATIONS_CENTER_DATA_UNAVAILABLE',
      message: error && error.message ? error.message : 'Unknown error'
    });
  }
};
