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

  if (!session || !session.accessToken || !session.expiresAt || session.expiresAt <= Date.now()) {
    return json(200, { connected: false }, {
      'Set-Cookie': clearCookie(SESSION_COOKIE),
    });
  }

  return json(200, {
    connected: true,
    name: session.name,
    authorUrn: session.authorUrn,
    expiresAt: session.expiresAt,
    picture: session.picture,
  });
};
