const {
  SESSION_COOKIE,
  decrypt,
  parseCookies,
  json,
} = require('./lib/linkedin-session');

const DEFAULT_TEST_POST = 'Looking for recommendations. Which AI platform has become essential to your daily business operations?';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'method_not_allowed', message: 'Use POST.' }, { Allow: 'POST' });
  }

  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie || '');
  const session = decrypt(cookies[SESSION_COOKIE]);

  if (!session || !session.accessToken || !session.authorUrn || session.expiresAt <= Date.now()) {
    return json(401, {
      error: 'linkedin_not_connected',
      message: 'Connect LinkedIn before publishing.',
    });
  }

  let requestBody = {};
  try {
    requestBody = event.body ? JSON.parse(event.body) : {};
  } catch {
    return json(400, { error: 'invalid_json', message: 'The request body must be valid JSON.' });
  }

  const commentary = String(requestBody.text || DEFAULT_TEST_POST).trim();
  if (!commentary || commentary.length > 3000) {
    return json(400, {
      error: 'invalid_post_text',
      message: 'Post text must contain between 1 and 3,000 characters.',
    });
  }

  try {
    const response = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202601',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: session.authorUrn,
        commentary,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }),
    });

    const responseText = await response.text();
    let responseData = null;
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch {
      responseData = responseText || null;
    }

    if (!response.ok) {
      return json(response.status, {
        error: 'linkedin_publish_failed',
        message: responseData?.message || responseData?.error_description || 'LinkedIn rejected the post.',
        linkedinStatus: response.status,
        details: responseData,
      });
    }

    const postId = response.headers.get('x-restli-id') || response.headers.get('x-linkedin-id') || null;
    return json(201, {
      published: true,
      postId,
      text: commentary,
      publishedAt: new Date().toISOString(),
    });
  } catch (error) {
    return json(500, {
      error: 'linkedin_publish_exception',
      message: error.message || 'Unexpected LinkedIn publishing error.',
    });
  }
};
