import { deleteQueuedPost, loadConnection, listQueue, publishToLinkedIn, saveQueuedPost } from "./_shared/linkedin-automation.mjs";

function pacificHour(date = new Date()) {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(date));
}

export default async () => {
  const now = new Date();
  if (pacificHour(now) !== 11) return;
  const posts = await listQueue();
  const due = posts.find((post) => post.status === "approved" && new Date(post.scheduledFor) <= now);
  if (!due) return;
  const session = await loadConnection();
  if (!session) {
    due.lastError = "LinkedIn authorization expired or is unavailable. Reconnect AG Publisher.";
    due.updatedAt = now.toISOString();
    await saveQueuedPost(due);
    return;
  }
  due.status = "publishing";
  due.updatedAt = now.toISOString();
  await saveQueuedPost(due);
  try {
    await publishToLinkedIn(session, due.text);
    await deleteQueuedPost(due.id);
    return;
  } catch (error) {
    due.status = "approved";
    due.lastError = error.message || "LinkedIn publishing failed.";
    due.updatedAt = new Date().toISOString();
    await saveQueuedPost(due);
  }
};

export const config = { schedule: "0 18,19 * * *" };
