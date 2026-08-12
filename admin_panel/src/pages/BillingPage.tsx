import { useEffect, useMemo, useState } from "react";
import {
  activateAdminMembership,
  activateAdminPremiumListing,
  cancelAdminInvoice,
  cancelAdminMembership,
  cancelAdminPremiumListing,
  createBillingPlan,
  deactivateBillingPlan,
  expireAdminMembership,
  expireAdminPremiumListing,
  getAdminInvoices,
  getAdminMemberships,
  getAdminPayments,
  getAdminPremiumListings,
  getBillingOverview,
  getBillingPlans,
  markAdminInvoicePaid,
  renewAdminMembership,
  type BillingOverview,
  type Invoice,
  type Membership,
  type MembershipPlan,
  type Payment,
  type PremiumListing,
} from "../api/billingApi";

type Tab = "overview" | "plans" | "memberships" | "premium" | "payments" | "invoices";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "plans", label: "Plans" },
  { id: "memberships", label: "Memberships" },
  { id: "premium", label: "Premium Listings" },
  { id: "payments", label: "Payments" },
  { id: "invoices", label: "Invoices" },
];

function money(value: number | string, currency = "INR") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function date(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

function badgeClass(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "active" || normalized === "success" || normalized === "paid") {
    return "status-badge status-active";
  }
  if (normalized === "pending" || normalized === "created" || normalized === "generated") {
    return "status-badge";
  }
  return "status-badge status-inactive";
}

export function BillingPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [premium, setPremium] = useState<PremiumListing[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [planName, setPlanName] = useState("");
  const [planCode, setPlanCode] = useState<"FREE" | "PREMIUM">("PREMIUM");
  const [planDescription, setPlanDescription] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [planDuration, setPlanDuration] = useState("30");
  const [savingPlan, setSavingPlan] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [o, p, m, pr, pay, inv] = await Promise.all([
        getBillingOverview(),
        getBillingPlans(true),
        getAdminMemberships(),
        getAdminPremiumListings(),
        getAdminPayments(),
        getAdminInvoices(),
      ]);
      setOverview(o);
      setPlans(p);
      setMemberships(m);
      setPremium(pr);
      setPayments(pay);
      setInvoices(inv);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load billing data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const activePlanCount = useMemo(
    () => plans.filter((item) => item.isActive).length,
    [plans],
  );

  async function runAction(action: () => Promise<unknown>, message: string) {
    setError("");
    try {
      await action();
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : message);
    }
  }

  async function handleCreatePlan() {
    const price = Number(planPrice);
    const durationDays = Number(planDuration);
    if (!planName.trim() || !Number.isFinite(price) || !Number.isFinite(durationDays)) {
      setError("Enter a valid plan name, price and duration.");
      return;
    }

    setSavingPlan(true);
    setError("");
    try {
      await createBillingPlan({
        name: planName.trim(),
        code: planCode,
        description: planDescription.trim() || undefined,
        price,
        durationDays,
      });
      setPlanName("");
      setPlanDescription("");
      setPlanPrice("");
      setPlanDuration("30");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create plan.");
    } finally {
      setSavingPlan(false);
    }
  }

  if (loading) {
    return <div className="page-loader">Loading billing management…</div>;
  }

  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>Billing & Monetization</h2>
          <p className="muted">
            Manage membership plans, memberships, premium listings, payments and invoices.
          </p>
        </div>
        <button className="secondary-button" onClick={() => void loadAll()}>
          Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="billing-tabs">
        {tabs.map((item) => (
          <button
            key={item.id}
            className={`billing-tab ${tab === item.id ? "active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" && overview && (
        <div className="stats-grid">
          <div className="stat-card"><span>Plans</span><strong>{overview.plans}</strong><small>{activePlanCount} active</small></div>
          <div className="stat-card"><span>Memberships</span><strong>{overview.memberships}</strong><small>{overview.activeMemberships} active</small></div>
          <div className="stat-card"><span>Premium listings</span><strong>{overview.premiumListings}</strong><small>{overview.activePremiumListings} active</small></div>
          <div className="stat-card"><span>Successful payments</span><strong>{overview.successfulPayments}</strong><small>{overview.payments} total</small></div>
          <div className="stat-card"><span>Invoices</span><strong>{overview.invoices}</strong><small>{overview.paidInvoices} paid</small></div>
          <div className="stat-card"><span>Recorded revenue</span><strong>{money(overview.revenue)}</strong><small>Successful payments</small></div>
        </div>
      )}

      {tab === "plans" && (
        <>
          <div className="content-card">
            <h3>Create membership plan</h3>
            <div className="billing-form-grid">
              <input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="Plan name" />
              <select value={planCode} onChange={(e) => setPlanCode(e.target.value as "FREE" | "PREMIUM")}>
                <option value="FREE">FREE</option>
                <option value="PREMIUM">PREMIUM</option>
              </select>
              <input value={planPrice} onChange={(e) => setPlanPrice(e.target.value)} type="number" min="0" placeholder="Price (INR)" />
              <input value={planDuration} onChange={(e) => setPlanDuration(e.target.value)} type="number" min="1" placeholder="Duration days" />
              <input value={planDescription} onChange={(e) => setPlanDescription(e.target.value)} placeholder="Description" />
              <button className="primary-button" disabled={savingPlan} onClick={() => void handleCreatePlan()}>
                {savingPlan ? "Saving…" : "Create plan"}
              </button>
            </div>
          </div>

          <div className="content-card">
            <div className="table-summary">{plans.length} plans</div>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Plan</th><th>Code</th><th>Price</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {plans.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong><div className="muted">{item.description || "—"}</div></td>
                      <td>{item.code}</td>
                      <td>{money(item.price)}</td>
                      <td>{item.durationDays} days</td>
                      <td><span className={item.isActive ? "status-badge status-active" : "status-badge status-inactive"}>{item.isActive ? "Active" : "Inactive"}</span></td>
                      <td>
                        {item.isActive && (
                          <button className="table-button danger-button" onClick={() => void runAction(() => deactivateBillingPlan(item.id), "Unable to deactivate plan.")}>
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "memberships" && (
        <div className="content-card">
          <div className="table-summary">{memberships.length} memberships</div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>User</th><th>Plan</th><th>Status</th><th>Dates</th><th>Auto renew</th><th>Actions</th></tr></thead>
              <tbody>
                {memberships.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.user?.fullName || item.userId}</strong><div className="muted">{item.user?.email || ""}</div></td>
                    <td>{item.plan?.name || item.planId}</td>
                    <td><span className={badgeClass(item.status)}>{item.status}</span></td>
                    <td>{date(item.startDate)} → {date(item.endDate)}</td>
                    <td>{item.autoRenew ? "Yes" : "No"}</td>
                    <td><div className="table-actions">
                      {item.status === "PENDING" && <button className="table-button" onClick={() => void runAction(() => activateAdminMembership(item.id), "Unable to activate membership.")}>Activate</button>}
                      {item.status === "ACTIVE" && <button className="table-button" onClick={() => void runAction(() => expireAdminMembership(item.id), "Unable to expire membership.")}>Expire</button>}
                      {(item.status === "ACTIVE" || item.status === "EXPIRED") && <button className="table-button" onClick={() => void runAction(() => renewAdminMembership(item.id), "Unable to renew membership.")}>Renew</button>}
                      {item.status !== "CANCELLED" && item.status !== "EXPIRED" && <button className="table-button danger-button" onClick={() => void runAction(() => cancelAdminMembership(item.id), "Unable to cancel membership.")}>Cancel</button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "premium" && (
        <div className="content-card">
          <div className="table-summary">{premium.length} premium listings</div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Property</th><th>Owner</th><th>Amount</th><th>Duration</th><th>Status</th><th>Dates</th><th>Actions</th></tr></thead>
              <tbody>
                {premium.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.property?.title || item.propertyId}</strong><div className="muted">{item.property ? `${item.property.city}${item.property.locality ? `, ${item.property.locality}` : ""}` : ""}</div></td>
                    <td>{item.user?.fullName || item.userId}</td>
                    <td>{money(item.amount, item.currency)}</td>
                    <td>{item.durationDays} days</td>
                    <td><span className={badgeClass(item.status)}>{item.status}</span></td>
                    <td>{date(item.startDate)} → {date(item.endDate)}</td>
                    <td><div className="table-actions">
                      {item.status === "PENDING" && <button className="table-button" onClick={() => void runAction(() => activateAdminPremiumListing(item.id), "Unable to activate premium listing.")}>Activate</button>}
                      {item.status === "ACTIVE" && <button className="table-button" onClick={() => void runAction(() => expireAdminPremiumListing(item.id), "Unable to expire premium listing.")}>Expire</button>}
                      {item.status !== "CANCELLED" && item.status !== "EXPIRED" && <button className="table-button danger-button" onClick={() => void runAction(() => cancelAdminPremiumListing(item.id), "Unable to cancel premium listing.")}>Cancel</button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "payments" && (
        <div className="content-card">
          <div className="table-summary">{payments.length} payments</div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Payment</th><th>Booking</th><th>Amount</th><th>Status</th><th>Razorpay</th><th>Created</th><th>Paid</th></tr></thead>
              <tbody>
                {payments.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.id}</strong></td>
                    <td>{item.bookingId}</td>
                    <td>{money(item.amount, item.currency)}</td>
                    <td><span className={badgeClass(item.status)}>{item.status}</span></td>
                    <td><div className="muted">{item.razorpayOrderId || "—"}</div><div className="muted">{item.razorpayPaymentId || "—"}</div></td>
                    <td>{date(item.createdAt)}</td>
                    <td>{date(item.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "invoices" && (
        <div className="content-card">
          <div className="table-summary">{invoices.length} invoices</div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Invoice</th><th>User</th><th>Amount</th><th>Tax</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {invoices.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.invoiceNumber}</strong><div className="muted">{item.description || ""}</div></td>
                    <td>{item.user?.fullName || item.userId}<div className="muted">{item.user?.email || ""}</div></td>
                    <td>{money(item.amount, item.currency)}</td>
                    <td>{money(item.taxAmount, item.currency)}</td>
                    <td>{money(item.totalAmount, item.currency)}</td>
                    <td><span className={badgeClass(item.status)}>{item.status}</span></td>
                    <td>{date(item.invoiceDate)}</td>
                    <td><div className="table-actions">
                      {item.status === "GENERATED" && <button className="table-button" onClick={() => void runAction(() => markAdminInvoicePaid(item.id), "Unable to mark invoice paid.")}>Mark paid</button>}
                      {item.status !== "CANCELLED" && item.status !== "PAID" && <button className="table-button danger-button" onClick={() => void runAction(() => cancelAdminInvoice(item.id), "Unable to cancel invoice.")}>Cancel</button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
