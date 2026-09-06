import { NextResponse } from "next/server";

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export function databaseErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "The database request failed.";
  const isSetupError = message.includes("ZARI_DB is not configured");
  return errorResponse(
    isSetupError ? message : "Unable to complete this request. Please try again.",
    isSetupError ? 503 : 500,
  );
}

export function requiredText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const text = value.trim().replace(/\s+/g, " ");
  return text && text.length <= maxLength ? text : null;
}

export function optionalText(value: unknown, maxLength: number) {
  return value === undefined || value === null || value === "" ? null : requiredText(value, maxLength);
}

export function validImageUrl(value: unknown) {
  const text = optionalText(value, 1_000);
  if (!text) return text;
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}
