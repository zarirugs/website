import { optionalText, requiredText } from "@/lib/server/http";
import type { CustomerAddress } from "@/lib/store/types";

export type AddressRow = {
  id: string;
  customer_id: string;
  label: string;
  recipient_name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_default: number;
};

export type AddressValues = {
  label: string;
  recipientName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
};

export function toCustomerAddress(address: AddressRow): CustomerAddress {
  return {
    id: address.id,
    label: address.label,
    recipientName: address.recipient_name,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postal_code,
    country: address.country,
    isDefault: address.is_default === 1,
  };
}

export function parseAddressValues(body: unknown, current?: AddressRow): AddressValues | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  const required = (key: string, existing: string | undefined, maxLength: number) => (
    value[key] === undefined ? existing ?? null : requiredText(value[key], key, maxLength)
  );
  const optional = (key: string, existing: string | null | undefined, maxLength: number) => (
    value[key] === undefined ? existing ?? null : optionalText(value[key], maxLength)
  );

  const label = required("label", current?.label, 60);
  const recipientName = required("recipientName", current?.recipient_name, 120);
  const line1 = required("line1", current?.line1, 160);
  const city = required("city", current?.city, 100);
  const country = required("country", current?.country, 100);
  const phone = optional("phone", current?.phone, 40);
  const line2 = optional("line2", current?.line2, 160);
  const state = optional("state", current?.state, 100);
  const postalCode = optional("postalCode", current?.postal_code, 40);
  const isDefault = typeof value.isDefault === "boolean" ? value.isDefault : current?.is_default === 1;

  if (!label || !recipientName || !line1 || !city || !country) return null;
  return { label, recipientName, phone, line1, line2, city, state, postalCode, country, isDefault };
}
