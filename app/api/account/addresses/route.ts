import { NextResponse } from "next/server";

import { getCurrentCustomer } from "@/lib/server/customer-account";
import { parseAddressValues, toCustomerAddress, type AddressRow } from "@/lib/server/customer-addresses";
import { databaseErrorResponse, errorResponse } from "@/lib/server/http";

export async function GET(request: Request) {
  try {
    const { database, customer } = await getCurrentCustomer(request);
    if (!customer) return errorResponse("Sign in to view your saved addresses.", 401);

    const result = await database.prepare(
      `SELECT id, customer_id, label, recipient_name, phone, line1, line2, city, state, postal_code, country, is_default
       FROM customer_addresses WHERE customer_id = ?
       ORDER BY is_default DESC, updated_at DESC`,
    ).bind(customer.id).all<AddressRow>();
    const response = NextResponse.json({ addresses: result.results.map(toCustomerAddress) });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const values = parseAddressValues(await request.json());
    if (!values) return errorResponse("Complete the required delivery address fields.");

    const { database, customer } = await getCurrentCustomer(request);
    if (!customer) return errorResponse("Sign in to save an address.", 401);

    const existing = await database.prepare(
      "SELECT COUNT(*) AS count FROM customer_addresses WHERE customer_id = ?",
    ).bind(customer.id).first<{ count: number }>();
    const isDefault = values.isDefault || (existing?.count ?? 0) === 0;
    const id = crypto.randomUUID();
    const insert = database.prepare(
      `INSERT INTO customer_addresses
        (id, customer_id, label, recipient_name, phone, line1, line2, city, state, postal_code, country, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, customer.id, values.label, values.recipientName, values.phone, values.line1, values.line2, values.city, values.state, values.postalCode, values.country, isDefault ? 1 : 0);

    if (isDefault) {
      await database.batch([
        database.prepare("UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?").bind(customer.id),
        insert,
      ]);
    } else {
      await insert.run();
    }

    const response = NextResponse.json({
      address: { id, ...values, isDefault },
    }, { status: 201 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
