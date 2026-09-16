import {
  SESSION_COOKIE,
  decrypt,
  json,
  parseCookies,
} from "./_shared/linkedin-personal-session.mjs";

export default async (request) => {
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed", message: "Use POST." }, 405, { Allow: "POST" });
  }

  const cookies = parseCookies(request.headers.get("cookie") || "");
  const session = decrypt(cookies[SESSION_COOKIE]);
  const scopes = String(session?.scope || "").split(/[ ,]+/).filter(Boolean);
  if (!session || session.mode !== "member" || !session.accessToken || session.expiresAt <= Date.now() || !scopes.includes("w_member_social")) {
    return json({ error: "linkedin_not_connected", message: "Connect Jeffery's LinkedIn profile before publishing." }, 401);
  }
  if (!String(session.authorUrn || "").startsWith("urn:li:person:")) {
    return json({ error: "invalid_publishing_target", message: "The active session is not a personal-profile authorization." }, 409);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json", message: "The request body must be valid JSON." }, 400);
  }
  const text = String(body?.text || "").trim();
  if (!text || text.length > 3000) {
    return json({ error: "invalid_post_text", message: "Post text must contain between 1 and 3,000 characters." }, 400);
  }

  try {
    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: session.authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });
    const responseText = await response.text();
    let details = responseText || null;
    try { details = responseText ? JSON.parse(responseText) : null; } catch {}

    if (!response.ok) {
      return json({
        error: "linkedin_publish_failed",
        message: details?.message || details?.error_description || "LinkedIn rejected the personal-profile post.",
        linkedinStatus: response.status,
        details,
      }, response.status);
    }

    return json({
      published: true,
      target: session.memberName,
      postId: response.headers.get("x-restli-id") || null,
      text,
      publishedAt: new Date().toISOString(),
    }, 201);
  } catch (error) {
    return json({ error: "linkedin_publish_exception", message: error.message || "Unexpected LinkedIn publishing error." }, 500);
  }
};

export const config = { path: "/api/linkedin-personal-publish" };
