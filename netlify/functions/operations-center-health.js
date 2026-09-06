const TARGETS = [
  { id: 'acb', name: 'ACB', url: 'https://acb.aproposgroupllc.com' },
  { id: 'natcorp', name: 'NAT-CORP', url: 'https://natcorp.aproposgroupllc.com' },
  { id: 'nebc', name: 'NEBC', url: 'https://nebc.aproposgroupllc.com' },
  { id: 'cdc', name: 'CDC', url: 'https://cdc.aproposgroupllc.com' },
  { id: 'rfcp', name: 'RFCP', url: 'https://rfcp.aproposgroupllc.com' },
  { id: 'ngcc', name: 'NGCC', url: 'https://ngcc.aproposgroupllc.com' },
  { id: 'alerts', name: 'Alerts', url: 'https://alerts.aproposgroupllc.com' },
  { id: 'businesscontracts', name: 'BusinessContracts', url: 'https://businesscontracts.aproposgroupllc.com' }
];

async function probe(target) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(target.url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'Apropos-Operations-Center/1.0' }
    });
    return {
      ...target,
      ok: response.status >= 200 && response.status < 500,
      status: response.status,
      latency_ms: Date.now() - started
    };
  } catch (error) {
    return {
      ...target,
      ok: false,
      status: 0,
      latency_ms: Date.now() - started,
      error: error && error.name === 'AbortError' ? 'timeout' : 'unreachable'
    };
  } finally {
    clearTimeout(timer);
  }
}

exports.handler = async () => {
  const checks = await Promise.all(TARGETS.map(probe));
  const online = checks.filter((item) => item.ok).length;
  const attention = checks.length - online;

  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0'
    },
    body: JSON.stringify({
      checked_at: new Date().toISOString(),
      total: checks.length,
      online,
      attention,
      status: attention === 0 ? 'NORMAL' : 'ATTENTION',
      checks
    })
  };
};
