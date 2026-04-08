// pages/BEntry.jsx
// Log a purchase/expense — function BEntry()
// Props: { user, expenses, setExpenses, capital, setCapital }

import { useCallback, useState } from 'react';
import { S, C } from '../utils/styles';
import { toDay, uid, isAdminUser, capitalTx, fmtRWF, jbinAppend, FX } from '../utils/helpers';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

const PURCHASE_CATS = ['Feed Purchase','Medicine','Veterinary','Equipment','Transport','Labour','Utilities','Maintenance','Pig Purchase','Other'];
const CAT_ITEMS = {
  'Feed Purchase': ['Maize bran','Soya meal','Pellets','Wheat bran','Kitchen waste','Cassava peels','Mixed feed','Fish meal','Cotton seed cake','Brewery waste'],
  'Medicine':      ['Ivermectin','ORS sachets','Multivitamins','Antibiotics','Dewormer','Electrolytes','Wound spray','Disinfectant (Dettol)','Acaricide','Iron injection'],
  'Veterinary':    ['Vet consultation fee','Vet call-out fee','Lab test fee','Diagnosis fee','Treatment fee'],
  'Equipment':     ['Feeding trough','Water nipples','Weighing scale','Wheelbarrow','Shovels','Hoe','Buckets','Spray pump','Feeders','Water tank'],
  'Transport':     ['Truck hire','Motorbike fee','Bus transport','Fuel','Loading fee'],
  'Labour':        ['Daily wages','Weekly wages','Cleaning labour','Construction labour','Loading/offloading'],
  'Utilities':     ['Electricity bill','Water bill','Phone airtime','Internet data'],
  'Maintenance':   ['Pen repair','Roof repair','Fence repair','Painting','Plumbing','Welding'],
  'Pig Purchase':  ['Weaner pig','Grower pig','Sow','Boar','Gilt','Piglet'],
  'Other':         ['Office supplies','Signage','Printing','Other expense'],
};
const UNIT_OPTIONS = ['kg','litres','doses','pcs','bags','boxes','heads'];

export default function BEntry({ user, expenses, setExpenses, capital, setCapital }) {
  const [form, setForm] = useState({ category: 'Feed Purchase', item: '', quantity: '', unit: 'kg', unitPrice: '', totalAmount: '', supplier: '', date: toDay(), notes: '' });
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [toast,   setToast]   = useState(null);
  const closeToast = useCallback(() => setToast(null), []);
  const [showItemSugg, setShowItemSugg] = useState(false);

  const pastSuppliers = [...new Set((expenses || []).map(e => e.supplier).filter(Boolean))].slice(0, 8);

  function updateCalc(f) {
    const q = parseFloat(f.quantity) || 0;
    const up= parseFloat(f.unitPrice) || 0;
    if (q > 0 && up > 0) return { ...f, totalAmount: String(Math.round(q * up)) };
    return f;
  }
  function updateCat(cat) {
    const unitMap = { 'Feed Purchase': 'kg', 'Medicine': 'doses', 'Equipment': 'pcs', 'Labour': 'pcs', 'Pig Purchase': 'heads' };
    setForm(f => ({ ...f, category: cat, item: '', unit: unitMap[cat] || f.unit }));
    setShowItemSugg(false);
  }

  const total = parseFloat(form.totalAmount) || 0;
  const suggestions = (CAT_ITEMS[form.category] || []).filter(s => !form.item || s.toLowerCase().includes(form.item.toLowerCase()));

  async function doSave() {
    if (saving) return;
    setSaving(true); setConfirm(false);
    const isAdmin = isAdminUser(user);
    const newExp = {
      id: uid(), workerId: user.uid || user.id, worker: user.name,
      category: form.category, item: form.item || form.category,
      quantity: form.quantity, unit: form.unit, unitPrice: form.unitPrice,
      amount: total, supplier: form.supplier,
      description: `${form.item || form.category}${form.quantity ? ' — ' + form.quantity + ' ' + (form.unit || '') : ''}${form.supplier ? ' from ' + form.supplier : ''}`,
      notes: form.notes, date: form.date, source: 'worker_purchase', approved: isAdmin ? true : false,
    };
    if (isAdmin && setCapital) capitalTx(capital, setCapital, { type: 'expense', category: form.category, amount: total, description: newExp.description, date: form.date });
    try {
      await jbinAppend('expenses', newExp);
      setExpenses(p => [...p.filter(x => x.id !== newExp.id), newExp]);
      FX.save();
      setToast({ type: 'success', message: isAdmin ? `✅ Purchase of ${fmtRWF(total)} recorded!` : `✅ Purchase submitted! Awaiting admin approval.` });
      setSaved(true);
      setTimeout(() => { setSaved(false); setForm({ category: 'Feed Purchase', item: '', quantity: '', unit: 'kg', unitPrice: '', totalAmount: '', supplier: '', date: toDay(), notes: '' }); }, 2200);
    } catch (e) { setToast({ type: 'error', message: 'Failed to save. Check internet and try again.' }); }
    setSaving(false);
  }

  return (
    <div style={{ maxWidth: 520 }}>
      {confirm && <ConfirmDialog title="Record This Purchase?" body={`${form.item || form.category} — RWF ${Math.round(total).toLocaleString()}${form.supplier ? ' from ' + form.supplier : ''}. Category: ${form.category}. Confirm?`} onConfirm={doSave} onCancel={() => setConfirm(false)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      <div style={S.h1}>🛒 Log Purchase</div>
      <div style={S.sub}>Record what you bought — submitted for admin approval</div>
      {saved && <div style={{ padding: 10, background: C.accentSoft, borderRadius: 7, marginBottom: 12, color: C.accent, fontSize: 13 }}>✓ Purchase recorded!</div>}
      <div style={S.card}>
        {/* Category pills */}
        <div style={{ marginBottom: 12 }}>
          <label style={S.lbl}>Category *</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PURCHASE_CATS.map(c => (
              <button key={c} onClick={() => updateCat(c)} style={{ padding: '6px 12px', borderRadius: 20, border: '1.5px solid ' + (form.category === c ? C.accent : C.border), background: form.category === c ? C.accent : 'transparent', color: form.category === c ? '#fff' : C.muted, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: form.category === c ? 700 : 400 }}>{c}</button>
            ))}
          </div>
        </div>

        {/* Item with suggestions */}
        <div style={{ marginBottom: 12, position: 'relative' }}>
          <label style={S.lbl}>What did you buy? *</label>
          <input placeholder={`e.g. ${(CAT_ITEMS[form.category] || [])[0] || 'Type item name'}…`} value={form.item}
            onChange={e => { setForm({ ...form, item: e.target.value }); setShowItemSugg(true); }}
            onFocus={() => setShowItemSugg(true)}
            onBlur={() => setTimeout(() => setShowItemSugg(false), 180)}
            style={S.inp} />
          {showItemSugg && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid ' + C.border, borderRadius: 8, zIndex: 999, boxShadow: '0 4px 16px rgba(0,0,0,.1)', maxHeight: 180, overflowY: 'auto' }}>
              {suggestions.map(s => (
                <div key={s} onMouseDown={() => { setForm(f => ({ ...f, item: s })); setShowItemSugg(false); }}
                  style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 13, color: C.text, borderBottom: '1px solid ' + C.elevated }}
                  onMouseEnter={e => e.currentTarget.style.background = C.accentSoft}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div><label style={S.lbl}>Quantity</label><input type="number" min="0" placeholder="e.g. 50" value={form.quantity} onChange={e => setForm(updateCalc({ ...form, quantity: e.target.value }))} style={S.inp} /></div>
          <div><label style={S.lbl}>Unit</label><select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} style={S.inp}>{UNIT_OPTIONS.map(u => <option key={u}>{u}</option>)}</select></div>
          <div><label style={S.lbl}>Unit Price (RWF)</label><input type="number" min="0" placeholder="e.g. 350" value={form.unitPrice} onChange={e => setForm(updateCalc({ ...form, unitPrice: e.target.value }))} style={S.inp} /></div>
          <div><label style={S.lbl}>Total Amount (RWF) *</label><input type="number" min="0" placeholder="Auto-calculated or type" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} style={S.inp} /></div>
          <div><label style={S.lbl}>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={S.inp} /></div>
          <div>
            <label style={S.lbl}>Supplier / Market</label>
            {pastSuppliers.length > 0
              ? <select value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} style={S.inp}><option value="">Select or type…</option>{pastSuppliers.map(s => <option key={s}>{s}</option>)}<option value="__new__">+ Other</option></select>
              : <input placeholder="e.g. Kimironko Market…" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} style={S.inp} />}
            {form.supplier === '__new__' && <input placeholder="Type supplier name…" style={{ ...S.inp, marginTop: 6 }} value="" onChange={e => setForm({ ...form, supplier: e.target.value })} />}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}><label style={S.lbl}>Notes (optional)</label><input placeholder="Any additional details…" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={S.inp} /></div>

        {total > 0 && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 9, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: C.muted }}>Total expense: <strong style={{ color: C.red, fontSize: 15 }}>{fmtRWF(total)}</strong></div>
            <div style={{ fontSize: 11, color: C.faint }}>Category: <span style={{ color: C.text, fontWeight: 600 }}>{form.category}</span></div>
          </div>
        )}

        <button disabled={saving || !total || total <= 0} style={{ ...S.btn(C.red), color: '#fff', width: '100%', padding: 12, fontSize: 14, opacity: (saving || !total || total <= 0) ? 0.5 : 1 }} onClick={() => !saving && total > 0 && setConfirm(true)}>
          {saving ? '⏳ Saving…' : '🛒 Save Purchase →'}
        </button>
        {(!total || total <= 0) && <div style={{ fontSize: 11, color: C.faint, marginTop: 7, textAlign: 'center' }}>Enter quantity × unit price, or type total amount directly</div>}
        {user.role !== 'admin' && <div style={{ fontSize: 11, color: C.muted, marginTop: 8, textAlign: 'center', padding: '7px', background: 'rgba(245,158,11,.06)', borderRadius: 6, border: '1px solid rgba(245,158,11,.2)' }}>⏳ Pending admin approval before it counts in records</div>}
      </div>
    </div>
  );
}
