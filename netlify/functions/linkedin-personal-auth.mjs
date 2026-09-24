import crypto from "node:crypto";
import { STATE_COOKIE, cookie, json, personalConfig, redirect } from "./_shared/linkedin-personal-session.mjs";

export default async () => {
  const { clientId, clientSecret, redirectUri, organizationId } = personalConfig();
  if (!clientId || !clientSecret || !redirectUri || !organizationId) {
    return json({
      error: "linkedin_organization_configuration_missing",
      message: "AG Publisher requires LinkedIn client credentials, redirect URI, and LINKEDIN_ORGANIZATION_ID in Netlify.",
    }, 500);
  }

  const state = crypto.randomBytes(24).toString("hex");
  const query = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile email w_organization_social",
  });

  return redirect(`https://www.linkedin.com/oauth/v2/authorization?${query}`, [
    cookie(STATE_COOKIE, state, 600),
  ]);
};

export const config = { path: "/linkedin-personal-auth" };
