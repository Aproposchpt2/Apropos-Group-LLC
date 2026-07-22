const crypto = require('crypto');
const { STATE_COOKIE, cookie, json } = require('./lib/linkedin-session');

exports.handler = async () => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return json(500, {
      error: 'linkedin_configuration_missing',
      message: 'LINKEDIN_CLIENT_ID and LINKEDIN_REDIRECT_URI must be configured in Netlify.',
    });
  }

  const state = crypto.randomBytes(24).toString('hex');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: 'openid profile w_organization_social',
  });

  return {
    statusCode: 302,
    headers: {
      Location: `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`,
      'Set-Cookie': cookie(STATE_COOKIE, state, 600),
      'Cache-Control': 'no-store',
    },
    body: '',
  };
};