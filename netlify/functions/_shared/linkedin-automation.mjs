import { getStore } from "@netlify/blobs";
import { decrypt, encrypt } from "./linkedin-personal-session.mjs";

const STORE_NAME = "ag-linkedin-publisher";
const TOKEN_KEY = "connection/member";
const QUEUE_PREFIX = "queue/";

export function linkedinStore() {
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

export async function saveConnection(session) {
  const store = linkedinStore();
  await store.set(TOKEN_KEY, encrypt(session));
}

export async function loadConnection() {
  const store = linkedinStore();
  const encrypted = await store.get(TOKEN_KEY);
  const session = decrypt(encrypted);
  const scopes = String(session?.scope || "").split(/[ ,]+/).filter(Boolean);
  if (!session || session.mode !== "member" || !session.accessToken || session.expiresAt <= Date.now() || !scopes.includes("w_member_social")) return null;
  return session;
}

export function validBrowserSession(session) {
  const scopes = String(session?.scope || "").split(/[ ,]+/).filter(Boolean);
  return Boolean(session && session.mode === "member" && session.accessToken && session.expiresAt > Date.now() && session.memberId && session.authorUrn === `urn:li:person:${session.memberId}` && scopes.includes("w_member_social"));
}

function postKey(id) { return `${QUEUE_PREFIX}${id}`; }

export async function listQueue() {
  const store = linkedinStore();
  const { blobs } = await store.list({ prefix: QUEUE_PREFIX });
  const posts = await Promise.all(blobs.map(({ key }) => store.get(key, { type: "json" })));
  return posts.filter(Boolean).sort((a, b) => String(a.scheduledFor).localeCompare(String(b.scheduledFor)));
}

export async function getQueuedPost(id) {
  return linkedinStore().get(postKey(id), { type: "json" });
}

export async function saveQueuedPost(post) {
  await linkedinStore().setJSON(postKey(post.id), post);
  return post;
}

export async function deleteQueuedPost(id) {
  await linkedinStore().delete(postKey(id));
}

export async function publishToLinkedIn(session, text) {
  if (!validBrowserSession(session)) {
    const error = new Error("A valid personal-profile authorization is required.");
    error.status = 401;
    throw error;
  }
  const linkedinVersion = String(Netlify.env.get("LINKEDIN_API_VERSION") || "202608").trim();
  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      "Linkedin-Version": linkedinVersion,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: session.authorUrn,
      commentary: text,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });
  const responseText = await response.text();
  let details = responseText || null;
  try { details = responseText ? JSON.parse(responseText) : null; } catch {}
  if (!response.ok) {
    const error = new Error(details?.message || details?.error_description || "LinkedIn rejected the post.");
    error.status = response.status;
    error.details = details;
    throw error;
  }
  return { postId: response.headers.get("x-restli-id") || null };
}

function pacificDateTime(dateText, hour = 11) {
  const noonUtc = new Date(`${dateText}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", timeZoneName: "shortOffset", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(noonUtc);
  const zone = parts.find((part) => part.type === "timeZoneName")?.value || "GMT-7";
  const offsetMatch = zone.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  const sign = offsetMatch?.[1] === "-" ? -1 : 1;
  const offsetMinutes = sign * (Number(offsetMatch?.[2] || 0) * 60 + Number(offsetMatch?.[3] || 0));
  const [year, month, day] = dateText.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, 0) - offsetMinutes * 60000).toISOString();
}

const STARTER_POSTS = [
  "Apropos Group LLC is building practical business intelligence systems that help organizations move from opportunity awareness to disciplined action. Premium Presence before Persuasion. Excellence Through Discipline.",
  "Government contracting opportunities are often scattered across agencies, portals, and formats. Our work focuses on organizing that complexity into clearer procurement intelligence for business-development professionals.",
  "The Business Development Management System gives advisors a focused way to search state, local, and federal opportunities while keeping the authoritative procurement source at the center of every decision.",
  "Strong opportunity development begins before the bid. Businesses need clear scope details, authoritative sources, disciplined review, and a realistic understanding of what the buyer is requesting.",
  "Apropos Group LLC develops systems that support advisors, economic-development organizations, and business-development agencies serving companies pursuing public-sector opportunities.",
  "Technology should reduce friction without replacing professional judgment. Our platforms organize procurement information so experienced advisors can focus on evaluation, guidance, and business outcomes.",
  "The Apropos Business Intelligence Marketplace brings our business-development systems together under one purpose: helping organizations find, understand, and act on credible opportunities.",
  "Contract preparedness is more than registration. It includes understanding the scope, confirming capability, identifying gaps, and approaching each opportunity with disciplined positioning.",
  "AI-powered communications can help small businesses manage high inbound call volume without abandoning the phone number their customers already know. Keep your number. Add the intelligence.",
  "Economic growth becomes more practical when business-support organizations have reliable tools for opportunity discovery, procurement research, and consistent client guidance.",
  "Every procurement record should lead back to its authoritative source. That principle protects accuracy, supports due diligence, and keeps final decisions grounded in the buyer’s actual requirements.",
  "Apropos Group LLC combines systems development, procurement intelligence, and business-development operations to build tools around real workflows—not abstract technology demonstrations.",
  "For advisors, the right search experience is not about ranking a business with an artificial score. It is about finding relevant opportunities and applying professional judgment to the client’s capabilities.",
  "Premium public presence is operational discipline made visible. Clear information, trustworthy sources, and consistent execution shape how an organization is understood before the first conversation begins.",
  "We are continuing to expand the Apropos portfolio around one standard: practical intelligence that supports better business-development decisions and stronger opportunity execution."
];

export async function ensureStarterQueue() {
  const existing = await listQueue();
  if (existing.length) return existing;
  const start = new Date("2026-09-17T12:00:00Z");
  const posts = STARTER_POSTS.map((text, index) => {
    const day = new Date(start);
    day.setUTCDate(day.getUTCDate() + index * 2);
    const dateText = day.toISOString().slice(0, 10);
    return {
      id: crypto.randomUUID(), text, scheduledFor: pacificDateTime(dateText), timeZone: "America/Los_Angeles",
      status: "draft", approvedAt: null, publishedAt: null, postId: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastError: null,
    };
  });
  await Promise.all(posts.map(saveQueuedPost));
  return posts;
}
