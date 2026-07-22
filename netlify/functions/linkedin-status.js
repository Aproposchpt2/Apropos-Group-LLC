const {
  SESSION_COOKIE,
  decrypt,
  parseCookies,
  clearCookie,
  json,
} = require('./lib/linkedin-session');

exports.handler = async (event) => {
  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie || '');
  const session = decrypt(cookies[SESSION_COOKIE]);
  const scopes = String(session?.scope || '').split(/[ ,]+/).filter(Boolean);
  const validOrganizationSession = Boolean(
    session &&
    session.mode === 'organization' &&
    session.accessToken &&
    session.expiresAt > Date.now() &&
    session.organizationId &&
    session.authorUrn === `urn:li:organization:${session.organizationId}` &&
    scopes.includes('w_organization_social')
  );

  if (!validOrganizationSession) {
    return json(200, {
      connected: false,
      targetType: 'organization',
      reason: session ? 'organization_reauthorization_required' : 'not_connected',
    }, {
      'Set-Cookie': clearCookie(SESSION_COOKIE),
    });
  }

  return json(200, {
    connected: true,
    targetType: 'organization',
    name: session.organizationName || 'AI For Businesses',
    organizationId: session.organizationId,
    organizationUrl: session.organizationUrl || 'https://www.linkedin.com/company/ai4businesses/',
    authorizedBy: session.memberName || null,
    authorUrn: session.authorUrn,
    expiresAt: session.expiresAt,
    scopes: session.scope,
  });
};
