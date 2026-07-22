const {
  SESSION_COOKIE,
  STATE_COOKIE,
  encrypt,
  parseCookies,
  cookie,
  clearCookie,
} = require('./lib/linkedin-session');

const CIME_URL = 'https://aproposgroupllc.com/cime/';

function redirect(location, cookies = []) {
  return {
    statusCode: 302,
    multiValueHeaders: cookies.length ? { 'Set-Cookie': cookies } : undefined,
    headers: { Location: location, 'Cache-Control': 'no-store' },
    body: '',
  };
}

exports.handler = async (event) => {
  const query = event.queryStringParameters || {};
  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie || '');
  const expectedState = cookies[STATE_COOKIE];

  if (query.error) {
    const detail = encodeURIComponent(query.error_description || query.error);
    return redirect(`${CIME_URL}?linkedin=error&detail=${detail}`, [clearCookie(STATE_COOKIE)]);
  }

  if (!query.code || !query.state || !expectedState || query.state !== expectedState) {
    return redirect(`${CIME_URL}?linkedin=error&detail=Invalid%20OAuth%20state`, [clearCookie(STATE_COOKIE)]);
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return redirect(`${CIME_URL}?linkedin=error&detail=Server%20configuration%20missing`, [clearCookie(STATE_COOKIE)]);
  }

  try {
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: query.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error || 'LinkedIn token exchange failed.');
    }

    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.sub) {
      throw new Error(profile.message || profile.error_description || 'LinkedIn profile verification failed.');
    }

    const expiresIn = Number(tokenData.expires_in || 5184000);
    const name = profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(' ') || 'LinkedIn Member';
    const session = encrypt({
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
      memberId: profile.sub,
      authorUrn: `urn:li:person:${profile.sub}`,
      name,
      picture: profile.picture || null,
      scope: tokenData.scope || 'openid profile w_member_social',
      mode: 'member_test',
    });

    return redirect(`${CIME_URL}?linkedin=connected`, [
      cookie(SESSION_COOKIE, session, expiresIn),
      clearCookie(STATE_COOKIE),
    ]);
  } catch (error) {
    const detail = encodeURIComponent(error.message || 'LinkedIn authorization failed.');
    return redirect(`${CIME_URL}?linkedin=error&detail=${detail}`, [clearCookie(STATE_COOKIE)]);
  }
};