"use client";
import { useEffect } from "react";
import { trackStoreEvent } from "@/lib/store/analytics";
export default function ProductView({ sku }: { sku: string }) { useEffect(() => { trackStoreEvent("product_view", sku); }, [sku]); return null; }
