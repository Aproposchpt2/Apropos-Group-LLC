import crypto from "node:crypto";

export const SESSION_COOKIE = "ag_linkedin_personal_session";
export const STATE_COOKIE = "ag_linkedin_personal_state";

function env(name) {
  return String(Netlify.env.get(name) || "").trim();
}

export function personalConfig() {
  return {
    clientId: env("LINKEDIN_PERSONAL_CLIENT_ID"),
    clientSecret: env("LINKEDIN_PERSONAL_CLIENT_SECRET"),
    redirectUri: env("LINKEDIN_PERSONAL_REDIRECT_URI"),
  };
}

function encryptionKey() {
  const { clientId, clientSecret } = personalConfig();
  if (!clientId || !clientSecret) {
    throw new Error("LinkedIn Publisher credentials are not configured.");
  }
  return crypto.createHash("sha256").update(`${clientId}:${clientSecret}`).digest();
}

export function encrypt(payload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(payload), "utf8")),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

export function decrypt(value) {
  if (!value) return null;
  try {
    const data = Buffer.from(value, "base64url");
    const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    const decrypted = Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8"));
  } catch {
    return null;
  }
}

export function parseCookies(header = "") {
  return header.split(";").reduce((cookies, part) => {
    const index = part.indexOf("=");
    if (index < 0) return cookies;
    const key = part.slice(0, index).trim();
    if (key) cookies[key] = decodeURIComponent(part.slice(index + 1).trim());
    return cookies;
  }, {});
}

export function cookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearCookie(name) {
  return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export function redirect(location, cookies = []) {
  const headers = new Headers({ Location: location, "Cache-Control": "no-store" });
  cookies.forEach((value) => headers.append("Set-Cookie", value));
  return new Response(null, { status: 302, headers });
}
