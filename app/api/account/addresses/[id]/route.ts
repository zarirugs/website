import { NextResponse } from "next/server";

import { getCurrentCustomer } from "@/lib/server/customer-account";
import { parseAddressValues, toCustomerAddress, type AddressRow } from "@/lib/server/customer-addresses";
import { databaseErrorResponse, errorResponse } from "@/lib/server/http";

type RouteContext = { params: Promise<{ id: string }> };

async function findAddress(request: Request, id: string) {
  const { database, customer } = await getCurrentCustomer(request);
  if (!customer) return { database, customer, address: null };
  const address = await database.prepare(
    `SELECT id, customer_id, label, recipient_name, phone, line1, line2, city, state, postal_code, country, is_default
     FROM customer_addresses WHERE id = ? AND customer_id = ?`,
  ).bind(id, customer.id).first<AddressRow>();
  return { database, customer, address };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { database, customer, address } = await findAddress(request, id);
    if (!customer) return errorResponse("Sign in to manage your saved addresses.", 401);
    if (!address) return errorResponse("Saved address not found.", 404);

    const values = parseAddressValues(await request.json(), address);
    if (!values) return errorResponse("Complete the required delivery address fields.");

    const update = database.prepare(
      `UPDATE customer_addresses
       SET label = ?, recipient_name = ?, phone = ?, line1 = ?, line2 = ?, city = ?, state = ?, postal_code = ?, country = ?,
         is_default = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND customer_id = ?`,
    ).bind(values.label, values.recipientName, values.phone, values.line1, values.line2, values.city, values.state, values.postalCode, values.country, values.isDefault ? 1 : 0, id, customer.id);

    if (values.isDefault) {
      await database.batch([
        database.prepare("UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ? AND id != ?").bind(customer.id, id),
        update,
      ]);
    } else {
      await update.run();
    }

    const response = NextResponse.json({
      address: toCustomerAddress({ ...address, id, ...{
        label: values.label,
        recipient_name: values.recipientName,
        phone: values.phone,
        line1: values.line1,
        line2: values.line2,
        city: values.city,
        state: values.state,
        postal_code: values.postalCode,
        country: values.country,
        is_default: values.isDefault ? 1 : 0,
      } }),
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { database, customer, address } = await findAddress(request, id);
    if (!customer) return errorResponse("Sign in to manage your saved addresses.", 401);
    if (!address) return errorResponse("Saved address not found.", 404);

    const statements = [
      database.prepare("DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?").bind(id, customer.id),
    ];
    if (address.is_default === 1) {
      statements.push(database.prepare(
        `UPDATE customer_addresses SET is_default = 1
         WHERE id = (SELECT id FROM customer_addresses WHERE customer_id = ? AND id != ? ORDER BY updated_at DESC LIMIT 1)`,
      ).bind(customer.id, id));
    }
    await database.batch(statements);

    const response = NextResponse.json({ deleted: true });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
