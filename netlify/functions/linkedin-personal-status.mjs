import {
  SESSION_COOKIE,
  clearCookie,
  decrypt,
  json,
  parseCookies,
} from "./_shared/linkedin-personal-session.mjs";

export default async (request) => {
  const cookies = parseCookies(request.headers.get("cookie") || "");
  const session = decrypt(cookies[SESSION_COOKIE]);
  const scopes = String(session?.scope || "").split(/[ ,]+/).filter(Boolean);
  const connected = Boolean(
    session &&
    session.mode === "member" &&
    session.accessToken &&
    session.expiresAt > Date.now() &&
    session.memberId &&
    session.authorUrn === `urn:li:person:${session.memberId}` &&
    scopes.includes("w_member_social")
  );

  if (!connected) {
    return json({ connected: false, targetType: "member", reason: session ? "reauthorization_required" : "not_connected" }, 200, {
      "Set-Cookie": clearCookie(SESSION_COOKIE),
    });
  }

  return json({
    connected: true,
    targetType: "member",
    name: session.memberName,
    authorUrn: session.authorUrn,
    expiresAt: session.expiresAt,
    scopes: session.scope,
  });
};

export const config = { path: "/api/linkedin-personal-status" };
