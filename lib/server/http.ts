import { NextResponse } from "next/server";

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function databaseErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "The database request failed.";
  const isSetupError = message.includes("ZARI_DB is not configured");

  return errorResponse(
    isSetupError ? message : "Unable to complete this request. Please try again.",
    isSetupError ? 503 : 500,
  );
}

export function requiredText(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string") return null;
  const text = value.trim().replace(/\s+/g, " ");
  if (!text || text.length > maxLength) return null;
  return text;
}

export function optionalText(value: unknown, maxLength: number) {
  if (value === undefined || value === null || value === "") return null;
  return requiredText(value, "value", maxLength);
}
