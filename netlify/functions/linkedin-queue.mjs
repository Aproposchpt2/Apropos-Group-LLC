import { SESSION_COOKIE, decrypt, json, parseCookies } from "./_shared/linkedin-personal-session.mjs";
import { deleteQueuedPost, ensureStarterQueue, getQueuedPost, listQueue, saveConnection, saveQueuedPost, validBrowserSession } from "./_shared/linkedin-automation.mjs";

function authorized(request) {
  const cookies = parseCookies(request.headers.get("cookie") || "");
  const session = decrypt(cookies[SESSION_COOKIE]);
  return validBrowserSession(session) ? session : null;
}

export default async (request) => {
  const session = authorized(request);
  if (!session) return json({ error: "linkedin_not_connected", message: "Connect an authorized Apropos Group LLC LinkedIn Page administrator to manage the queue." }, 401);
  await saveConnection(session);

  if (request.method === "GET") {
    await ensureStarterQueue();
    return json({ posts: await listQueue(), cadence: "Every other day", localTime: "11:00 AM Pacific", approvalRequired: true, target: "Apropos Group LLC company page" });
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid_json", message: "The request body must be valid JSON." }, 400); }
  const id = String(body?.id || "").trim();
  if (!id) return json({ error: "missing_id", message: "A queue item ID is required." }, 400);
  const post = await getQueuedPost(id);
  if (!post) return json({ error: "not_found", message: "The queued post was not found." }, 404);

  if (request.method === "DELETE") {
    if (post.status === "published") return json({ error: "published_post", message: "Published history cannot be deleted here." }, 409);
    await deleteQueuedPost(id);
    return json({ deleted: true, id });
  }
  if (request.method !== "POST") return json({ error: "method_not_allowed", message: "Use GET, POST, or DELETE." }, 405);

  const action = String(body?.action || "");
  if (!["approve", "return_to_draft", "update"].includes(action)) return json({ error: "invalid_action", message: "Choose approve, return_to_draft, or update." }, 400);
  if (post.status === "published") return json({ error: "published_post", message: "Published history cannot be changed." }, 409);

  if (action === "update") {
    const text = String(body?.text || "").trim();
    const scheduledFor = new Date(body?.scheduledFor || "");
    if (!text || text.length > 3000) return json({ error: "invalid_post_text", message: "Post text must contain between 1 and 3,000 characters." }, 400);
    if (Number.isNaN(scheduledFor.getTime())) return json({ error: "invalid_schedule", message: "Choose a valid publishing date and time." }, 400);
    post.text = text;
    post.scheduledFor = scheduledFor.toISOString();
    post.status = "draft";
    post.approvedAt = null;
  } else if (action === "approve") {
    post.status = "approved";
    post.approvedAt = new Date().toISOString();
    post.lastError = null;
  } else {
    post.status = "draft";
    post.approvedAt = null;
  }
  post.updatedAt = new Date().toISOString();
  await saveQueuedPost(post);
  return json({ post });
};

export const config = { path: "/api/linkedin-queue" };
