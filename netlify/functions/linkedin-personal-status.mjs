import { SESSION_COOKIE, clearCookie, decrypt, json, parseCookies } from "./_shared/linkedin-personal-session.mjs";
import { loadConnection, saveConnection, validBrowserSession } from "./_shared/linkedin-automation.mjs";

export default async (request) => {
  const cookies = parseCookies(request.headers.get("cookie") || "");
  const browserSession = decrypt(cookies[SESSION_COOKIE]);
  if (validBrowserSession(browserSession)) await saveConnection(browserSession);
  const session = validBrowserSession(browserSession) ? browserSession : await loadConnection();
  if (!session) return json({ connected: false, targetType: "member", reason: browserSession ? "reauthorization_required" : "not_connected" }, 200, { "Set-Cookie": clearCookie(SESSION_COOKIE) });
  return json({ connected: true, targetType: "member", name: session.memberName, authorUrn: session.authorUrn, expiresAt: session.expiresAt, scopes: session.scope, automationReady: true });
};

export const config = { path: "/api/linkedin-personal-status" };
