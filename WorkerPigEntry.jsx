// pages/WorkerPigEntry.jsx
// Worker pig registration — function WorkerPigEntry()
// Props: { user, pigs, setPigs, pendingPigs, setPendingPigs }

import { useEffect, useState } from 'react';
import { S, C } from '../utils/styles';
import { toDay, uid, genPigTag, fsSet, isAdminUser } from '../utils/helpers';
import { jbinAppend } from '../firebase';

const BREEDS = ['Landrace', 'Large White', 'Duroc', 'Hampshire', 'Mixed/Local'];
const STAGES = ['Piglet', 'Weaner', 'Grower', 'Finisher', 'Gilt', 'Sow', 'Boar'];

export default function WorkerPigEntry({ user, pigs, setPigs, pendingPigs, setPendingPigs }) {
  function makeBlank() {
    return { breed: 'Landrace', stage: 'Piglet', gender: 'Female', weight: '', length: '', dob: '', arrivalDate: toDay(), source: '', batchName: '', purchasePrice: '', notes: '' };
  }
  const [form,      setForm]      = useState(makeBlank());
  const [submitted, setSubmitted] = useState(false);
  const [tab,       setTab]       = useState('form');

  const myPending = (pendingPigs || []).filter(p => p.submittedBy === user.id).slice().reverse();

  function updateBreedOrStage(field, val) {
    setForm(f => {
      const newBreed = field === 'breed' ? val : f.breed;
      const newStage = field === 'stage' ? val : f.stage;
      const allForCount = [...pigs, ...(pendingPigs || [])];
      return { ...f, [field]: val, tag: genPigTag(newBreed, newStage, allForCount) };
    });
  }

  useEffect(() => {
    setForm(f => ({ ...f, tag: genPigTag(f.breed, f.stage, [...pigs, ...(pendingPigs || [])]) }));
  }, []);

  async function submit() {
    const allForCount = [...pigs, ...(pendingPigs || [])];
    const tag = form.tag || genPigTag(form.breed, form.stage, allForCount);
    const newEntry = {
      ...form, tag,
      id: uid(),
      submittedBy: user.id,
      submittedByName: user.name,
      submittedAt: new Date().toISOString(),
      approved: false,
      weight: parseFloat(form.weight) || 0,
      length: parseFloat(form.length) || null,
    };
    const updated = [...(pendingPigs || []), newEntry];
    setPendingPigs(updated);
    fsSet('pendingPigs', updated);
    try { await jbinAppend('pendingPigs', newEntry); } catch (e) { console.error(e); }
    setForm(makeBlank());
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setTab('history');
  }

  const statusColor = { pending: C.amber, approved: C.accent, rejected: C.red };
  const statusBg    = { pending: 'rgba(245,158,11,.1)', approved: 'rgba(22,163,74,.1)', rejected: 'rgba(239,68,68,.08)' };
  const statusLabel = { pending: '⏳ Pending', approved: '✅ Approved', rejected: '✗ Rejected' };

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={S.h1}>🐷 Register Pig</div>
      <div style={S.sub}>Submit pig details · Admin will approve and add to herd</div>

      <div style={{ display: 'flex', background: C.elevated, borderRadius: 9, padding: 3, marginBottom: 16, gap: 2, border: '1px solid ' + C.border }}>
        {[['form','➕ New Registration'], ['history','📋 My Submissions']].map(([t, l]) => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      {tab === 'form' && (
        <div>
          {submitted && <div style={{ padding: '10px 14px', background: C.accentSoft, border: '1px solid rgba(22,163,74,.3)', borderRadius: 9, marginBottom: 14, color: C.accent, fontWeight: 600 }}>✅ Submitted! Awaiting admin approval.</div>}
          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, marginBottom: 12 }}>🐷 Pig Details</div>

            {/* Tag preview */}
            <div style={{ padding: '10px 14px', background: 'rgba(22,163,74,.06)', border: '1px solid rgba(22,163,74,.2)', borderRadius: 9, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ fontSize: 9, color: C.faint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Auto-Generated Pig Code</div>
                <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace', color: C.accent, letterSpacing: 1 }}>{form.tag || '—'}</div>
                <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>Breed · Stage · YYMM · Sequence</div>
              </div>
              <button onClick={() => setForm(f => ({ ...f, tag: genPigTag(f.breed, f.stage, [...pigs, ...(pendingPigs || [])]) }))} style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid rgba(22,163,74,.35)', background: 'rgba(22,163,74,.06)', color: C.accent, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>🔄 Regen</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11, marginBottom: 12 }}>
              <div>
                <label style={S.lbl}>Breed</label>
                <select value={form.breed} onChange={e => updateBreedOrStage('breed', e.target.value)} style={S.inp}>
                  {BREEDS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={S.lbl}>Stage</label>
                <select value={form.stage} onChange={e => updateBreedOrStage('stage', e.target.value)} style={S.inp}>
                  {STAGES.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={S.lbl}>Gender</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} style={S.inp}>
                  <option>Female</option><option>Male</option>
                </select>
              </div>
              <div>
                <label style={S.lbl}>Weight (kg)</label>
                <input type="number" step="0.1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} style={S.inp} placeholder="e.g. 25" />
              </div>
              <div>
                <label style={S.lbl}>Length (cm)</label>
                <input type="number" step="0.5" value={form.length} onChange={e => setForm({ ...form, length: e.target.value })} style={S.inp} placeholder="e.g. 70" />
              </div>
              <div>
                <label style={S.lbl}>Date of Birth</label>
                <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} style={S.inp} />
              </div>
              <div>
                <label style={S.lbl}>Arrival Date</label>
                <input type="date" value={form.arrivalDate} onChange={e => setForm({ ...form, arrivalDate: e.target.value })} style={S.inp} />
              </div>
              <div>
                <label style={S.lbl}>Source Farm / Supplier</label>
                <input placeholder="e.g. Musanze Farm" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} style={S.inp} />
              </div>
              <div>
                <label style={S.lbl}>Purchase Price (RWF)</label>
                <input type="number" placeholder="e.g. 35000" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} style={S.inp} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={S.lbl}>Notes / Observations</label>
                <textarea rows={2} placeholder="Any notes about this pig..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...S.inp, resize: 'vertical' }} />
              </div>
            </div>
            <button onClick={submit} style={{ ...S.btn(), width: '100%', padding: 12, fontSize: 14 }}>
              📤 Submit for Admin Approval →
            </button>
            <div style={{ fontSize: 11, color: C.faint, marginTop: 8, textAlign: 'center' }}>Your submission will be reviewed before the pig is added to the herd.</div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div>
          {myPending.length === 0 && (
            <div style={{ ...S.card, color: C.faint, fontSize: 13, textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🐷</div>No submissions yet.
            </div>
          )}
          {myPending.map((p, i) => {
            const st = p.approved === true ? 'approved' : p.approved === false && p.rejected ? 'rejected' : 'pending';
            return (
              <div key={i} style={{ ...S.card, marginBottom: 10, borderLeft: '3px solid ' + (statusColor[st] || C.border) }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, fontFamily: 'monospace', color: C.text }}>{p.tag}</div>
                    <div style={{ fontSize: 11, color: C.faint }}>{p.breed} · {p.stage} · {p.gender} · {p.weight || 0}kg</div>
                  </div>
                  <span style={{ padding: '2px 9px', borderRadius: 20, background: statusBg[st], color: statusColor[st], fontSize: 11, fontWeight: 700 }}>{statusLabel[st] || '⏳ Pending'}</span>
                </div>
                <div style={{ fontSize: 11, color: C.faint }}>Submitted: {(p.submittedAt || '').slice(0, 10)}</div>
                {p.adminNote && <div style={{ marginTop: 6, fontSize: 12, color: C.blue, padding: '5px 9px', background: 'rgba(96,165,250,.07)', borderRadius: 6 }}>💬 Admin: {p.adminNote}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
