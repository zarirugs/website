import type { D1Database } from "@/lib/server/d1";
import {
  base64ToBytes,
  bytesToBase64,
  bytesToBase64Url,
  sha256,
  stringToBytes,
  timingSafeEqual,
} from "@/lib/server/crypto";

const sessionCookieName = "zari_admin_session";
const sessionLifetimeSeconds = 60 * 60 * 8;
// Workers Free allows 10 ms CPU per request. Keep PBKDF2 below that ceiling
// while still deriving a salted SHA-256 password hash for the owner portal.
const passwordIterations = 30_000;

export type AuthenticatedAdmin = { id: string; email: string; fullName: string; role: "owner" | "manager" };

type AdminRow = {
  id: string;
  email: string;
  full_name: string;
  role: "owner" | "manager";
  password_hash: string;
  password_salt: string;
};

function cookieValue(request: Request, name: string) {
  const prefix = `${name}=`;
  return request.headers.get("cookie")?.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(prefix))?.slice(prefix.length);
}

async function passwordHash(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", stringToBytes(password), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new Uint8Array(salt), iterations: passwordIterations },
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
  return timingSafeEqual(await passwordHash(password, base64ToBytes(storedSalt)), base64ToBytes(storedHash));
}

export async function findAdminByEmail(database: D1Database, email: string) {
  return database.prepare(
    "SELECT id, email, full_name, role, password_hash, password_salt FROM admin_users WHERE email = ?",
  ).bind(email).first<AdminRow>();
}

export async function getAuthenticatedAdmin(request: Request, database: D1Database): Promise<AuthenticatedAdmin | null> {
  const token = cookieValue(request, sessionCookieName);
  if (!token) return null;
  return database.prepare(
    `SELECT admin_users.id, admin_users.email, admin_users.full_name AS fullName, admin_users.role
     FROM admin_sessions JOIN admin_users ON admin_users.id = admin_sessions.admin_id
     WHERE admin_sessions.token_hash = ? AND admin_sessions.expires_at > CURRENT_TIMESTAMP`,
  ).bind(await sha256(token)).first<AuthenticatedAdmin>();
}

export async function createAdminSession(database: D1Database, adminId: string) {
  const token = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  await database.batch([
    database.prepare("DELETE FROM admin_sessions WHERE admin_id = ? OR expires_at <= CURRENT_TIMESTAMP").bind(adminId),
    database.prepare(
      "INSERT INTO admin_sessions (id, admin_id, token_hash, expires_at) VALUES (?, ?, ?, datetime('now', '+8 hours'))",
    ).bind(crypto.randomUUID(), adminId, await sha256(token)),
  ]);
  return token;
}

export async function deleteCurrentAdminSession(request: Request, database: D1Database) {
  const token = cookieValue(request, sessionCookieName);
  if (token) await database.prepare("DELETE FROM admin_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
}

export function adminSessionCookie(token: string, request: Request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${sessionCookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionLifetimeSeconds}${secure}`;
}

export function expiredAdminSessionCookie(request: Request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export async function adminCount(database: D1Database) {
  const row = await database.prepare("SELECT COUNT(*) AS count FROM admin_users").first<{ count: number }>();
  return row?.count ?? 0;
}
