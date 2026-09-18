import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Membership } from '../api/billingApi';
import {
  createPremiumPlanConfig,
  getMembershipAccounts,
  getPremiumPlanConfigs,
  updateMembershipAccount,
  updatePremiumPlanConfig,
  type PlanInput,
  type PremiumPlanConfig,
} from '../api/premiumManagementApi';

const blankPlan: PlanInput = { name: '', code: 'PREMIUM', description: '', price: 99, durationDays: 30, trialDays: 30, features: [], displayOrder: 0, isActive: true };
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString() : '—';
const money = (value: number | string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value));

export function PremiumManagementPage() {
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState<PremiumPlanConfig[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [planDialog, setPlanDialog] = useState<PremiumPlanConfig | 'new' | null>(null);
  const [membershipDialog, setMembershipDialog] = useState<Membership | null>(null);
  const [planForm, setPlanForm] = useState<PlanInput>(blankPlan);
  const [featuresText, setFeaturesText] = useState('');
  const [membershipPlanId, setMembershipPlanId] = useState('');
  const [extendDays, setExtendDays] = useState('30');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setError('');
    try {
      const [p, m] = await Promise.all([getPremiumPlanConfigs(), getMembershipAccounts()]);
      setPlans(p); setMemberships(m);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load premium management.'); }
  }
  useEffect(() => { void load(); }, []);

  useEffect(() => {
    const recordId = searchParams.get('record');
    if (!recordId) return;
    const match = memberships.find((membership) => membership.id === recordId);
    if (match) openMembership(match);
  }, [searchParams, memberships]);

  const activePlans = useMemo(() => plans.filter((p) => p.isActive), [plans]);

  function openPlan(plan?: PremiumPlanConfig) {
    if (!plan) { setPlanForm(blankPlan); setFeaturesText(''); setPlanDialog('new'); return; }
    setPlanForm({ name: plan.name, code: plan.code, description: plan.description || '', price: Number(plan.price), durationDays: plan.durationDays, trialDays: plan.trialDays, features: plan.features || [], displayOrder: plan.displayOrder, isActive: plan.isActive });
    setFeaturesText((plan.features || []).join('\n')); setPlanDialog(plan);
  }

  async function savePlan() {
    setBusy(true); setError('');
    const payload = { ...planForm, features: featuresText.split('\n').map((v) => v.trim()).filter(Boolean) };
    try {
      if (planDialog === 'new') await createPremiumPlanConfig(payload);
      else if (planDialog) await updatePremiumPlanConfig(planDialog.id, payload);
      setPlanDialog(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save plan.'); }
    finally { setBusy(false); }
  }

  function openMembership(item: Membership) {
    setMembershipDialog(item); setMembershipPlanId(item.planId); setExtendDays('30'); setNotes(item.notes || '');
  }

  async function saveMembership(status?: Membership['status']) {
    if (!membershipDialog) return;
    setBusy(true); setError('');
    try {
      await updateMembershipAccount(membershipDialog.id, {
        planId: membershipPlanId || undefined,
        status,
        extendDays: Number(extendDays) > 0 ? Number(extendDays) : undefined,
        notes,
      });
      setMembershipDialog(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update membership.'); }
    finally { setBusy(false); }
  }

  return <section>
    <div className="section-heading"><div><h2>Premium Memberships</h2><p className="muted">Configure plans and control user membership accounts.</p></div><button className="primary-button" onClick={() => openPlan()}>Create plan</button></div>
    {error && <div className="error-banner">{error}</div>}
    <div className="stats-grid">
      <div className="stat-card"><span>Plans</span><strong>{plans.length}</strong><small>{activePlans.length} active</small></div>
      <div className="stat-card"><span>Memberships</span><strong>{memberships.length}</strong><small>{memberships.filter((m) => m.status === 'ACTIVE').length} active</small></div>
      <div className="stat-card"><span>Trials</span><strong>{memberships.filter((m) => (m as Membership & { isTrial?: boolean }).isTrial).length}</strong><small>membership accounts</small></div>
    </div>

    <div className="content-card"><h3>Plans</h3><div className="table-container"><table className="data-table"><thead><tr><th>Plan</th><th>Price</th><th>Duration</th><th>Trial</th><th>Features</th><th>Status</th><th /></tr></thead><tbody>{plans.map((p) => <tr key={p.id}><td><strong>{p.name}</strong><div className="muted">{p.description || p.code}</div></td><td>{money(p.price)}</td><td>{p.durationDays} days</td><td>{p.trialDays} days</td><td>{(p.features || []).join(', ') || '—'}</td><td>{p.isActive ? 'Active' : 'Inactive'}</td><td><button className="table-button" onClick={() => openPlan(p)}>Manage</button></td></tr>)}</tbody></table></div></div>

    <div className="content-card"><h3>User memberships</h3><div className="table-container"><table className="data-table"><thead><tr><th>User</th><th>Plan</th><th>Status</th><th>Period</th><th>Payment / invoice</th><th /></tr></thead><tbody>{memberships.map((m) => <tr key={m.id}><td><strong>{m.user?.fullName || m.userId}</strong><div className="muted">{m.user?.email || ''}</div></td><td>{m.plan?.name || m.planId}</td><td>{m.status}</td><td>{date(m.startDate)} → {date(m.endDate)}</td><td><span className="muted">{(m as Membership & { razorpayPaymentId?: string | null }).razorpayPaymentId || (m as Membership & { invoices?: Array<{ invoiceNumber: string }> }).invoices?.[0]?.invoiceNumber || '—'}</span></td><td><button className="table-button" onClick={() => openMembership(m)}>Manage</button></td></tr>)}</tbody></table></div></div>

    {planDialog && <div className="modal-backdrop" onClick={() => setPlanDialog(null)}><div className="modal-card" onClick={(e) => e.stopPropagation()}><h3>{planDialog === 'new' ? 'Create plan' : 'Edit plan'}</h3><div className="billing-form-grid">
      <input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="Plan name" />
      <select value={planForm.code} onChange={(e) => setPlanForm({ ...planForm, code: e.target.value as PlanInput['code'] })}><option value="FREE">FREE</option><option value="PREMIUM">PREMIUM</option></select>
      <input type="number" min="0" value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })} placeholder="Price" />
      <input type="number" min="1" value={planForm.durationDays} onChange={(e) => setPlanForm({ ...planForm, durationDays: Number(e.target.value) })} placeholder="Duration days" />
      <input type="number" min="0" value={planForm.trialDays} onChange={(e) => setPlanForm({ ...planForm, trialDays: Number(e.target.value) })} placeholder="Trial days" />
      <input type="number" min="0" value={planForm.displayOrder} onChange={(e) => setPlanForm({ ...planForm, displayOrder: Number(e.target.value) })} placeholder="Display order" />
      <textarea value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} placeholder="Description" />
      <textarea value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder="Features / benefits — one per line" />
      <label><input type="checkbox" checked={planForm.isActive} onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })} /> Active</label>
    </div><div className="modal-actions"><button className="secondary-button" onClick={() => setPlanDialog(null)}>Cancel</button><button className="primary-button" disabled={busy} onClick={() => void savePlan()}>{busy ? 'Saving…' : 'Save plan'}</button></div></div></div>}

    {membershipDialog && <div className="modal-backdrop" onClick={() => setMembershipDialog(null)}><div className="modal-card" onClick={(e) => e.stopPropagation()}><h3>Manage membership</h3><p><strong>{membershipDialog.user?.fullName || membershipDialog.userId}</strong><br/><span className="muted">{membershipDialog.user?.email || ''}</span></p><label>Plan<select value={membershipPlanId} onChange={(e) => setMembershipPlanId(e.target.value)}>{plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {money(p.price)}</option>)}</select></label><label>Extend days<input type="number" min="0" value={extendDays} onChange={(e) => setExtendDays(e.target.value)} /></label><label>Notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></label><p className="muted">Current: {membershipDialog.status} · {date(membershipDialog.startDate)} → {date(membershipDialog.endDate)}</p><div className="modal-actions"><button className="secondary-button" onClick={() => setMembershipDialog(null)}>Close</button><button className="table-button" disabled={busy} onClick={() => void saveMembership('ACTIVE')}>Activate / restore</button><button className="primary-button" disabled={busy} onClick={() => void saveMembership()}>Save / extend</button><button className="table-button danger-button" disabled={busy} onClick={() => void saveMembership('CANCELLED')}>Cancel membership</button></div></div></div>}
  </section>;
}
