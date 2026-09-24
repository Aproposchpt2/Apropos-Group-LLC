import crypto from "node:crypto";
import { STATE_COOKIE, cookie, json, personalConfig, redirect } from "./_shared/linkedin-personal-session.mjs";

export default async () => {
  const { clientId, clientSecret, redirectUri } = personalConfig();
  if (!clientId || !clientSecret || !redirectUri) {
    return json({
      error: "linkedin_personal_configuration_missing",
      message: "The AG Publisher credentials are not fully configured in Netlify.",
    }, 500);
  }

  // Personal-profile posting stopgap (2026-09-23): AG Publisher was never
  // granted w_organization_social, and Community Management API can't be
  // added to this app (it already has other products) -- see
  // memory/project_linkedin_ag_community_publisher.md. Reverted from a
  // concurrent organization-mode rewrite back to member-scope so the queue
  // can actually be approved and published today. Re-apply org mode once
  // AG Community Publisher's Community Management API request is approved.
  const state = crypto.randomBytes(24).toString("hex");
  const query = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile email w_member_social",
  });

  return redirect(`https://www.linkedin.com/oauth/v2/authorization?${query}`, [
    cookie(STATE_COOKIE, state, 600),
  ]);
};

export const config = { path: "/linkedin-personal-auth" };
