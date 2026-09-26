import { DRAFTS } from "./_shared/linkedin-draft-manifest.mjs";
import { linkedinStore, listQueue, saveQueuedPost } from "./_shared/linkedin-automation.mjs";

function pacificEleven(dateText) {
  const noonUtc = new Date(`${dateText}T12:00:00Z`);
  if (Number.isNaN(noonUtc.getTime()) || noonUtc.toISOString().slice(0, 10) !== dateText) throw new Error("Invalid draft date");
  const zone = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", timeZoneName: "shortOffset" })
    .formatToParts(noonUtc).find((part) => part.type === "timeZoneName")?.value;
  const match = zone?.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) throw new Error("Pacific time offset unavailable");
  const minutes = (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] || 0));
  return new Date(noonUtc.getTime() - 60 * 60 * 1000 - minutes * 60 * 1000).toISOString();
}

function dayPlus(dateText, days) {
  const date = new Date(`${dateText}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function importDrafts(drafts = DRAFTS, existing = null, save = saveQueuedPost, ledger = null) {
  const posts = existing ?? await listQueue();
  const store = ledger ?? linkedinStore();
  const occupied = new Set(posts.filter((p) => p.status !== "published").map((p) => p.scheduledFor));
  const seen = new Set(posts.map((p) => p.text));
  const keys = new Set(posts.map((p) => p.importKey).filter(Boolean));
  const created = [];
  for (const draft of drafts) {
    if (!draft.key || !draft.preferredDate || !draft.text?.trim() || draft.text.length > 3000) throw new Error("Invalid draft manifest entry");
    const ledgerKey = `imported/${draft.key}`;
    if (keys.has(draft.key) || await store.get(ledgerKey)) continue;
    if (seen.has(draft.text)) {
      await store.set(ledgerKey, "already-present");
      continue;
    }
    let date = draft.preferredDate;
    let scheduledFor = pacificEleven(date);
    for (let attempt = 0; occupied.has(scheduledFor) && attempt < 30; attempt++) {
      date = dayPlus(date, 2);
      scheduledFor = pacificEleven(date);
    }
    if (occupied.has(scheduledFor)) throw new Error("No available cadence slot for draft");
    const now = new Date().toISOString();
    const post = {
      id: crypto.randomUUID(), importKey: draft.key, text: draft.text, scheduledFor,
      timeZone: "America/Los_Angeles", status: "draft", approvedAt: null,
      publishedAt: null, postId: null, createdAt: now, updatedAt: now, lastError: null,
    };
    await save(post);
    await store.set(ledgerKey, post.id);
    created.push(post);
    occupied.add(scheduledFor);
    seen.add(draft.text);
    keys.add(draft.key);
  }
  return created;
}

export default async () => {
  const created = await importDrafts();
  console.log(`LinkedIn draft import: ${created.length} created`);
};

export const config = { schedule: "0 * * * *" };
