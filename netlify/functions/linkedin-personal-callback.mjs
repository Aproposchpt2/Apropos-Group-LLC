import { SESSION_COOKIE, STATE_COOKIE, clearCookie, cookie, encrypt, parseCookies, personalConfig, redirect } from "./_shared/linkedin-personal-session.mjs";
import { saveConnection } from "./_shared/linkedin-automation.mjs";

const CONTROL_URL = "/linkedin-publisher/";

export default async (request) => {
  const url = new URL(request.url);
  const query = url.searchParams;
  const cookies = parseCookies(request.headers.get("cookie") || "");
  const expectedState = cookies[STATE_COOKIE];
  if (query.get("error")) return redirect(`${CONTROL_URL}?linkedin=error&detail=${encodeURIComponent(query.get("error_description") || query.get("error"))}`, [clearCookie(STATE_COOKIE)]);
  if (!query.get("code") || !query.get("state") || !expectedState || query.get("state") !== expectedState) return redirect(`${CONTROL_URL}?linkedin=error&detail=Invalid%20OAuth%20state`, [clearCookie(STATE_COOKIE)]);

  const { clientId, clientSecret, redirectUri } = personalConfig();
  if (!clientId || !clientSecret || !redirectUri) return redirect(`${CONTROL_URL}?linkedin=error&detail=AG%20Publisher%20configuration%20is%20incomplete`, [clearCookie(STATE_COOKIE)]);
  try {
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code: query.get("code"), client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri }),
    });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token.access_token) throw new Error(token.error_description || token.error || "LinkedIn token exchange failed.");
    const scopes = String(token.scope || "").split(/[ ,]+/).filter(Boolean);
    if (!scopes.includes("w_member_social")) throw new Error("LinkedIn did not grant w_member_social for personal-profile publishing.");
    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } });
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.sub) throw new Error(profile.message || profile.error_description || "LinkedIn profile verification failed.");
    const expiresIn = Number(token.expires_in || 5184000);
    const sessionData = {
      mode: "member", accessToken: token.access_token, expiresAt: Date.now() + expiresIn * 1000,
      memberId: profile.sub, memberName: profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(" ") || "LinkedIn Member",
      memberEmail: profile.email || null, picture: profile.picture || null, authorUrn: `urn:li:person:${profile.sub}`, scope: scopes.join(" "),
    };
    await saveConnection(sessionData);
    return redirect(`${CONTROL_URL}?linkedin=connected`, [cookie(SESSION_COOKIE, encrypt(sessionData), expiresIn), clearCookie(STATE_COOKIE)]);
  } catch (error) {
    return redirect(`${CONTROL_URL}?linkedin=error&detail=${encodeURIComponent(error.message || "LinkedIn authorization failed.")}`, [clearCookie(STATE_COOKIE)]);
  }
};

export const config = { path: "/linkedin-personal-callback" };
