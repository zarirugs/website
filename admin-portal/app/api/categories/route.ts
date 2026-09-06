import { NextResponse } from "next/server";

import { authenticatedAdminContext } from "@/lib/server/guard";
import { databaseErrorResponse, errorResponse, optionalText, requiredText, validImageUrl } from "@/lib/server/http";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: number;
  product_count: number;
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

export async function GET(request: Request) {
  try {
    const context = await authenticatedAdminContext(request);
    if (!context) return errorResponse("Unauthorised.", 401);
    const result = await context.database.prepare(
      `SELECT categories.id, categories.name, categories.slug, categories.description, categories.image_url,
        categories.sort_order, categories.is_active, COUNT(product_catalog.sku) AS product_count
       FROM categories LEFT JOIN product_catalog ON product_catalog.category_id = categories.id
       GROUP BY categories.id ORDER BY categories.sort_order ASC, categories.name ASC`,
    ).all<CategoryRow>();
    return NextResponse.json({ categories: result.results.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.image_url,
      sortOrder: category.sort_order,
      isActive: category.is_active === 1,
      productCount: category.product_count,
    })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await authenticatedAdminContext(request);
    if (!context) return errorResponse("Unauthorised.", 401);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return errorResponse("Enter category details.");
    const values = body as Record<string, unknown>;
    const name = requiredText(values.name, 80);
    const slug = optionalText(values.slug, 80) ? slugify(String(values.slug)) : name ? slugify(name) : "";
    const description = optionalText(values.description, 500);
    const imageUrl = validImageUrl(values.imageUrl);
    const sortOrder = values.sortOrder === undefined ? 0 : values.sortOrder;
    if (!name || !slug || imageUrl === null || typeof sortOrder !== "number" || !Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10_000) {
      return errorResponse("Enter a name, valid image URL, and valid display order.");
    }

    const category = { id: crypto.randomUUID(), name, slug, description, imageUrl, sortOrder };
    await context.database.prepare(
      `INSERT INTO categories (id, name, slug, description, image_url, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(category.id, category.name, category.slug, category.description, category.imageUrl, category.sortOrder).run();
    return NextResponse.json({ category }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && /unique|constraint/i.test(error.message)) return errorResponse("That category name or URL slug already exists.", 409);
    return databaseErrorResponse(error);
  }
}
