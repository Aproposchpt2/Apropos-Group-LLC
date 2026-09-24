import { SESSION_COOKIE, decrypt, json, parseCookies } from "./_shared/linkedin-personal-session.mjs";
import { publishToLinkedIn, saveConnection, validBrowserSession } from "./_shared/linkedin-automation.mjs";

export default async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed", message: "Use POST." }, 405, { Allow: "POST" });
  const cookies = parseCookies(request.headers.get("cookie") || "");
  const session = decrypt(cookies[SESSION_COOKIE]);
  if (!validBrowserSession(session)) return json({ error: "linkedin_not_connected", message: "Connect Jeffery's LinkedIn profile before publishing." }, 401);
  if (!String(session.authorUrn || "").startsWith("urn:li:person:")) return json({ error: "invalid_publishing_target", message: "The active session is not a personal-profile authorization." }, 409);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid_json", message: "The request body must be valid JSON." }, 400); }
  const text = String(body?.text || "").trim();
  if (!text || text.length > 3000) return json({ error: "invalid_post_text", message: "Post text must contain between 1 and 3,000 characters." }, 400);
  try {
    await saveConnection(session);
    const result = await publishToLinkedIn(session, text);
    return json({ published: true, target: session.memberName, postId: result.postId, text, publishedAt: new Date().toISOString() }, 201);
  } catch (error) {
    return json({ error: "linkedin_publish_failed", message: error.message || "LinkedIn publishing failed.", linkedinStatus: error.status || 500 }, error.status || 500);
  }
};

export const config = { path: "/api/linkedin-personal-publish" };
