"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Heart, MapPin, Package, ShoppingBag, Trash2, UserRound } from "lucide-react";

import { site } from "@/lib/data/site";
import type { Cart, Customer, CustomerAddress, CustomerOrder, WishlistItem } from "@/lib/store/types";
import styles from "./AccountPage.module.css";

type DashboardData = {
  orders: CustomerOrder[];
  addresses: CustomerAddress[];
  wishlist: WishlistItem[];
};

type DashboardProps = {
  user: Customer;
  cart: Cart;
  refresh: () => Promise<void>;
  updateCart: (sku: string, quantity: number) => Promise<Cart>;
};

const initialData: DashboardData = { orders: [], addresses: [], wishlist: [] };

function messageFrom(result: unknown, fallback: string) {
  return result && typeof result === "object" && "error" in result && typeof result.error === "string"
    ? result.error
    : fallback;
}

async function responseJson<T>(response: Response, fallback: string): Promise<T> {
  const result: unknown = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(messageFrom(result, fallback));
  return result as T;
}

function dateLabel(value: string) {
  const date = new Date(value.endsWith("Z") ? value : `${value}Z`);
  return Number.isNaN(date.valueOf()) ? "Recently" : new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    new: "Request received",
    confirmed: "Confirmed",
    payment_pending: "Payment pending",
    paid: "Payment received",
    in_production: "In production",
    ready: "Ready for dispatch",
    shipped: "Shipped",
    delivered: "Delivered",
    fulfilled: "Delivered",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

function addressLines(address: CustomerAddress) {
  return [
    address.recipientName,
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    address.country,
    address.phone,
  ].filter(Boolean);
}

export default function AccountDashboard({ user, cart, refresh, updateCart }: DashboardProps) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [profileName, setProfileName] = useState(user.fullName);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const [orders, addresses, wishlist] = await Promise.all([
        fetch("/api/account/orders", { cache: "no-store" }).then((response) => responseJson<{ orders: CustomerOrder[] }>(response, "Unable to load your orders.")),
        fetch("/api/account/addresses", { cache: "no-store" }).then((response) => responseJson<{ addresses: CustomerAddress[] }>(response, "Unable to load your saved addresses.")),
        fetch("/api/account/wishlist", { cache: "no-store" }).then((response) => responseJson<{ wishlist: WishlistItem[] }>(response, "Unable to load your saved pieces.")),
      ]);
      setData({ orders: orders.orders, addresses: addresses.addresses, wishlist: wishlist.wishlist });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load your account details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("profile");
    setNotice("");
    setError("");
    try {
      await responseJson(
        await fetch("/api/account", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName: profileName }),
        }),
        "Unable to update your profile.",
      );
      await refresh();
      setNotice("Your account details have been updated.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update your profile.");
    } finally {
      setBusyAction("");
    }
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusyAction("address");
    setNotice("");
    setError("");
    try {
      await responseJson(
        await fetch("/api/account/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: form.get("label"),
            recipientName: form.get("recipientName"),
            phone: form.get("phone"),
            line1: form.get("line1"),
            line2: form.get("line2"),
            city: form.get("city"),
            state: form.get("state"),
            postalCode: form.get("postalCode"),
            country: form.get("country"),
            isDefault: form.get("isDefault") === "on",
          }),
        }),
        "Unable to save this address.",
      );
      event.currentTarget.reset();
      setShowAddressForm(false);
      setNotice("Your delivery address has been saved.");
      await loadDashboard();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save this address.");
    } finally {
      setBusyAction("");
    }
  }

  async function setDefaultAddress(address: CustomerAddress) {
    setBusyAction(`address-${address.id}`);
    setNotice("");
    setError("");
    try {
      await responseJson(
        await fetch(`/api/account/addresses/${address.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isDefault: true }),
        }),
        "Unable to update your default address.",
      );
      setNotice(`${address.label} is now your default delivery address.`);
      await loadDashboard();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update your default address.");
    } finally {
      setBusyAction("");
    }
  }

  async function removeAddress(address: CustomerAddress) {
    if (!window.confirm(`Remove the ${address.label} address?`)) return;
    setBusyAction(`address-${address.id}`);
    setNotice("");
    setError("");
    try {
      await responseJson(
        await fetch(`/api/account/addresses/${address.id}`, { method: "DELETE" }),
        "Unable to remove this address.",
      );
      setNotice("The saved address has been removed.");
      await loadDashboard();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to remove this address.");
    } finally {
      setBusyAction("");
    }
  }

  async function removeSavedPiece(item: WishlistItem) {
    setBusyAction(`wishlist-${item.sku}`);
    setNotice("");
    setError("");
    try {
      await responseJson(
        await fetch("/api/account/wishlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sku: item.sku }),
        }),
        "Unable to remove this saved piece.",
      );
      setData((current) => ({ ...current, wishlist: current.wishlist.filter((saved) => saved.sku !== item.sku) }));
      setNotice(`${item.name} was removed from your saved pieces.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to remove this saved piece.");
    } finally {
      setBusyAction("");
    }
  }

  async function addSavedPieceToBag(item: WishlistItem) {
    if (!item.isActive || item.stock < 1) return;
    setBusyAction(`bag-${item.sku}`);
    setNotice("");
    setError("");
    try {
      const currentQuantity = cart.items.find((cartItem) => cartItem.sku === item.sku)?.quantity ?? 0;
      await updateCart(item.sku, Math.min(item.stock, currentQuantity + 1));
      setNotice(`${item.name} was added to your shopping bag.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to add this piece to your bag.");
    } finally {
      setBusyAction("");
    }
  }

  return (
    <div className={styles.dashboard}>
      <nav className={styles.accountNav} aria-label="Account options">
        <a href="#orders" className={styles.accountNavLink}><Package size={17} /><span>Orders</span><strong>{data.orders.length}</strong></a>
        <a href="#saved-pieces" className={styles.accountNavLink}><Heart size={17} /><span>Saved pieces</span><strong>{data.wishlist.length}</strong></a>
        <a href="#addresses" className={styles.accountNavLink}><MapPin size={17} /><span>Addresses</span><strong>{data.addresses.length}</strong></a>
        <Link href="/cart" className={styles.accountNavLink}><ShoppingBag size={17} /><span>Shopping bag</span><strong>{cart.itemCount}</strong></Link>
      </nav>

      {(notice || error) && <p className={error ? styles.alertError : styles.alertSuccess} role="status">{error || notice}</p>}

      <section id="orders" className={styles.accountSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionEyebrow}>Order history</p>
            <h2 className={styles.sectionTitle}>Your orders</h2>
          </div>
          <Link href="/#order" className={styles.textAction}>Begin an order request <span aria-hidden="true">→</span></Link>
        </div>

        {loading ? <p className={styles.sectionLoading}>Loading your order history…</p> : data.orders.length ? (
          <div className={styles.orderList}>
            {data.orders.map((order) => (
              <article key={order.id} className={styles.orderCard}>
                <div className={styles.orderMeta}>
                  <div>
                    <p className={styles.orderNumber}>{order.orderNumber}</p>
                    <p className={styles.orderDate}>Placed {dateLabel(order.createdAt)}</p>
                  </div>
                  <span className={styles.orderStatus}>{statusLabel(order.status)}</span>
                </div>
                <div className={styles.orderItems}>
                  {order.items.map((item) => <p key={`${order.id}-${item.sku}`}>{item.quantity} × {item.name}</p>)}
                </div>
                {order.deliveryAddress && <p className={styles.orderAddress}>Delivery: {order.deliveryAddress}</p>}
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Package size={20} aria-hidden="true" />
            <div><h3>No orders yet</h3><p>When you reserve a piece while signed in, its status and details will appear here.</p></div>
          </div>
        )}
      </section>

      <section id="saved-pieces" className={styles.accountSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionEyebrow}>Private collection</p>
            <h2 className={styles.sectionTitle}>Saved pieces</h2>
          </div>
          <Link href="/#collections" className={styles.textAction}>Explore collections <span aria-hidden="true">→</span></Link>
        </div>

        {loading ? <p className={styles.sectionLoading}>Loading your saved pieces…</p> : data.wishlist.length ? (
          <div className={styles.savedGrid}>
            {data.wishlist.map((item) => (
              <article key={item.sku} className={styles.savedCard}>
                <div className={styles.savedImage} style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined} />
                <div className={styles.savedDetails}>
                  <p className={styles.cardEyebrow}>{item.collection}</p>
                  <h3>{item.name}</h3>
                  {item.description && <p>{item.description}</p>}
                  <div className={styles.savedActions}>
                    <button disabled={busyAction === `bag-${item.sku}` || !item.isActive || item.stock < 1} onClick={() => void addSavedPieceToBag(item)} className={styles.primaryAction}>
                      {busyAction === `bag-${item.sku}` ? "Adding…" : item.isActive && item.stock > 0 ? "Add to bag" : "Unavailable"}
                    </button>
                    <button disabled={busyAction === `wishlist-${item.sku}`} onClick={() => void removeSavedPiece(item)} className={styles.iconAction} aria-label={`Remove ${item.name} from saved pieces`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Heart size={20} aria-hidden="true" />
            <div><h3>Your private collection is empty</h3><p>Save pieces from a collection page to revisit them here.</p></div>
          </div>
        )}
      </section>

      <section id="addresses" className={styles.accountSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionEyebrow}>Delivery preferences</p>
            <h2 className={styles.sectionTitle}>Saved addresses</h2>
          </div>
          <button onClick={() => setShowAddressForm((current) => !current)} className={styles.textAction}>
            {showAddressForm ? "Close form" : "Add an address"} <span aria-hidden="true">{showAddressForm ? "×" : "+"}</span>
          </button>
        </div>

        {loading ? <p className={styles.sectionLoading}>Loading your saved addresses…</p> : (
          <>
            {data.addresses.length ? (
              <div className={styles.addressGrid}>
                {data.addresses.map((address) => (
                  <article key={address.id} className={styles.addressCard}>
                    <div className={styles.addressMeta}><p className={styles.cardEyebrow}>{address.label}</p>{address.isDefault && <span>Default</span>}</div>
                    <address>{addressLines(address).map((line) => <span key={line}>{line}</span>)}</address>
                    <div className={styles.addressActions}>
                      {!address.isDefault && <button disabled={busyAction === `address-${address.id}`} onClick={() => void setDefaultAddress(address)} className={styles.secondaryAction}>Set as default</button>}
                      <button disabled={busyAction === `address-${address.id}`} onClick={() => void removeAddress(address)} className={styles.subtleAction}>Remove</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <MapPin size={20} aria-hidden="true" />
                <div><h3>No saved addresses</h3><p>Save a delivery address now to make your next order request easier.</p></div>
              </div>
            )}

            {showAddressForm && (
              <form onSubmit={saveAddress} className={styles.addressForm}>
                <div className={styles.formHeader}><p className={styles.cardEyebrow}>New delivery address</p><p>Fields marked * are required.</p></div>
                <div className={styles.formGrid}>
                  <label>Address label *<input required name="label" maxLength={60} placeholder="Home, project site, studio…" /></label>
                  <label>Recipient name *<input required name="recipientName" maxLength={120} defaultValue={user.fullName} /></label>
                  <label>Telephone<input name="phone" type="tel" maxLength={40} autoComplete="tel" /></label>
                  <label>Country *<input required name="country" maxLength={100} autoComplete="country-name" /></label>
                  <label className={styles.formWide}>Address line 1 *<input required name="line1" maxLength={160} autoComplete="address-line1" /></label>
                  <label className={styles.formWide}>Address line 2<input name="line2" maxLength={160} autoComplete="address-line2" /></label>
                  <label>City *<input required name="city" maxLength={100} autoComplete="address-level2" /></label>
                  <label>State / region<input name="state" maxLength={100} autoComplete="address-level1" /></label>
                  <label>Postal code<input name="postalCode" maxLength={40} autoComplete="postal-code" /></label>
                </div>
                <div className={styles.formFooter}>
                  <label className={styles.checkbox}><input name="isDefault" type="checkbox" defaultChecked={data.addresses.length === 0} /> Make this my default delivery address</label>
                  <button disabled={busyAction === "address"} className={styles.primaryAction}>{busyAction === "address" ? "Saving…" : "Save address"}</button>
                </div>
              </form>
            )}
          </>
        )}
      </section>

      <section id="profile" className={styles.accountSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionEyebrow}>Account settings</p>
            <h2 className={styles.sectionTitle}>Profile & concierge</h2>
          </div>
        </div>
        <div className={styles.settingsGrid}>
          <form onSubmit={updateProfile} className={styles.profileForm}>
            <UserRound size={20} aria-hidden="true" />
            <div><h3>Profile details</h3><p>Your email is used for your private account and order updates.</p></div>
            <label>Full name<input required value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={120} /></label>
            <label>Email address<input value={user.email} readOnly aria-readonly="true" /></label>
            <button disabled={busyAction === "profile"} className={styles.primaryAction}>{busyAction === "profile" ? "Saving…" : "Save details"}</button>
          </form>
          <aside className={styles.conciergeCard}>
            <p className={styles.cardEyebrow}>Need assistance?</p>
            <h3>Contact the concierge</h3>
            <p>For changes to an order, account access, bespoke requirements, or delivery guidance, our atelier will help personally.</p>
            <a href={`mailto:${site.email}?subject=${encodeURIComponent("ZARI account enquiry")}`} className={styles.primaryAction}>Email concierge</a>
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className={styles.subtleAction}>{site.phone}</a>
          </aside>
        </div>
      </section>
    </div>
  );
}
