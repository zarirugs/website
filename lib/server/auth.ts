import type { D1Database } from "@/lib/server/d1";
import { base64ToBytes, bytesToBase64, bytesToBase64Url, sha256, stringToBytes, timingSafeEqual } from "@/lib/server/crypto";

const sessionLifetimeSeconds = 60 * 60 * 24 * 7;
// Workers Free permits 10 ms CPU per request. This keeps PBKDF2 within that
// budget while retaining a unique random salt and SHA-256 derived hash.
const passwordIterations = 30_000;
const sessionCookieName = "zari_session";

export type AuthenticatedCustomer = {
  id: string;
  email: string;
  fullName: string;
};

type CustomerRow = {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  password_salt: string;
};

type SessionRow = {
  id: string;
  email: string;
  full_name: string;
};

function cookieValue(request: Request, name: string) {
  const encodedName = `${name}=`;
  return request.headers.get("cookie")?.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(encodedName))?.slice(encodedName.length);
}

async function passwordHash(password: string, salt: Uint8Array) {
  const normalizedSalt = new Uint8Array(salt);
  const key = await crypto.subtle.importKey(
    "raw",
    stringToBytes(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: normalizedSalt, iterations: passwordIterations },
    key,
    256,
  );
  return new Uint8Array(derived);
}

export async function createPasswordRecord(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await passwordHash(password, salt);
  return { passwordHash: bytesToBase64(hash), passwordSalt: bytesToBase64(salt) };
}

export async function passwordMatches(password: string, storedHash: string, storedSalt: string) {
  const computed = await passwordHash(password, base64ToBytes(storedSalt));
  return timingSafeEqual(computed, base64ToBytes(storedHash));
}

export function customerFromRow(row: Pick<CustomerRow, "id" | "email" | "full_name">): AuthenticatedCustomer {
  return { id: row.id, email: row.email, fullName: row.full_name };
}

export async function findCustomerByEmail(database: D1Database, email: string) {
  return database.prepare(
    "SELECT id, email, full_name, password_hash, password_salt FROM customers WHERE email = ?",
  ).bind(email).first<CustomerRow>();
}

export async function getAuthenticatedCustomer(request: Request, database: D1Database) {
  const token = cookieValue(request, sessionCookieName);
  if (!token) return null;

  const tokenHash = await sha256(token);
  const session = await database.prepare(
    `SELECT customers.id, customers.email, customers.full_name
     FROM customer_sessions
     JOIN customers ON customers.id = customer_sessions.customer_id
     WHERE customer_sessions.token_hash = ? AND customer_sessions.expires_at > CURRENT_TIMESTAMP`,
  ).bind(tokenHash).first<SessionRow>();

  return session ? { id: session.id, email: session.email, fullName: session.full_name } : null;
}

export async function createSession(database: D1Database, customerId: string) {
  const token = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256(token);

  await database.batch([
    database.prepare("DELETE FROM customer_sessions WHERE customer_id = ? OR expires_at <= CURRENT_TIMESTAMP").bind(customerId),
    database.prepare(
      `INSERT INTO customer_sessions (id, customer_id, token_hash, expires_at)
       VALUES (?, ?, ?, datetime('now', '+7 days'))`,
    ).bind(crypto.randomUUID(), customerId, tokenHash),
  ]);

  return token;
}

export async function deleteCurrentSession(request: Request, database: D1Database) {
  const token = cookieValue(request, sessionCookieName);
  if (!token) return;
  await database.prepare("DELETE FROM customer_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
}

export function sessionCookie(token: string, request: Request) {
  const isSecure = new URL(request.url).protocol === "https:";
  return `${sessionCookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionLifetimeSeconds}${isSecure ? "; Secure" : ""}`;
}

export function expiredSessionCookie(request: Request) {
  const isSecure = new URL(request.url).protocol === "https:";
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isSecure ? "; Secure" : ""}`;
}
