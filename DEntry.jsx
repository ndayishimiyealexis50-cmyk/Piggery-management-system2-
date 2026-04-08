// pages/DEntry.jsx
// Daily report entry — function DEntry()
// Props: { user, pigs, logs, setLogs, capital, setCapital }

import { useCallback, useState } from 'react';
import { S, C } from '../utils/styles';
import { toDay, uid, isAdminUser, capitalTx, jbinAppend, getWAAlertPrefs, sendWhatsApp, FX } from '../utils/helpers';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

export default function DEntry({ user, pigs, logs, setLogs, capital, setCapital }) {
  const active = pigs.filter(p => p.status === 'active');
  const [form, setForm] = useState({ checked: active.length, sick: 0, deaths: 0, births: 0, water: true, cleaned: true, notes: '', deathLossAmount: '' });
  const [done,    setDone]    = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);
  const [tab,     setTab]     = useState('form');
  const closeToast = useCallback(() => setToast(null), []);

  const myLogs   = logs.filter(l => l.workerId === user.id).slice().reverse().slice(0, 10);
  const todayDone= logs.some(l => l.workerId === user.id && l.date === toDay());

  async function doSave() {
    if (saving) return;
    setSaving(true);
    setConfirm(false);
    const isAdmin = isAdminUser(user);
    const newLog = { ...form, id: uid(), workerId: user.uid || user.id, worker: user.name, date: toDay(), approved: isAdmin ? true : false };
    if (isAdmin && setCapital && form.deaths > 0 && parseFloat(form.deathLossAmount) > 0) {
      capitalTx(capital, setCapital, { type: 'expense', category: 'Pig Death Loss', amount: parseFloat(form.deathLossAmount), description: `${form.deaths} pig(s) died — entered by ${user.name}`, date: toDay() });
    }
    try {
      await jbinAppend('logs', newLog);
      setLogs(p => [...p.filter(x => x.id !== newLog.id), newLog]);
      FX.save();
      setToast({ type: 'success', message: isAdmin ? '✅ Daily report saved!' : '✅ Report submitted! Awaiting admin approval.' });
      if (isAdmin) {
        const waPrefs = getWAAlertPrefs();
        if (form.sick > 0 && waPrefs.onSickPig) sendWhatsApp(`🚨 FarmIQ Alert — ${toDay()}\n🏥 ${form.sick} sick pig(s) reported by ${user.name}.`);
        if (form.deaths > 0 && waPrefs.onDeath)  sendWhatsApp(`💀 FarmIQ Alert — ${toDay()}\n${form.deaths} pig death(s) recorded by ${user.name}.`);
      }
      setTimeout(() => setDone(true), 1600);
    } catch (e) { setToast({ type: 'error', message: 'Failed to save. Check internet and try again.' }); }
    setSaving(false);
  }

  // Worker done view
  if ((!user || user.role !== 'admin') && (todayDone || done)) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 48 }}>✅</div>
      <div style={{ fontSize: 19, fontWeight: 700, color: C.accent, marginTop: 14 }}>Report submitted!</div>
      <div style={{ fontSize: 13, color: C.faint, marginTop: 6 }}>Come back tomorrow.</div>
      {myLogs.length > 0 && (
        <div style={{ marginTop: 24, textAlign: 'left', maxWidth: 400, margin: '24px auto 0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>📋 My Recent Reports</div>
          {myLogs.slice(0, 5).map((l, i) => (
            <div key={i} style={{ ...S.card, padding: '10px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{l.date}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: l.approved === false ? 'rgba(245,158,11,.12)' : 'rgba(22,163,74,.1)', color: l.approved === false ? C.amber : C.accent, fontWeight: 700 }}>{l.approved === false ? '⏳ Pending' : '✅ Approved'}</span>
              </div>
              <div style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>Checked: {l.checked} · Sick: {l.sick} · Deaths: {l.deaths}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 490 }}>
      {confirm && <ConfirmDialog title="Submit Daily Report?" body={`Checked: ${form.checked} pigs · Sick: ${form.sick} · Deaths: ${form.deaths} · Births: ${form.births}. Submit for ${toDay()}?`} onConfirm={doSave} onCancel={() => setConfirm(false)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <div style={{ display: 'flex', background: C.elevated, borderRadius: 9, padding: 3, marginBottom: 16, gap: 2, border: '1px solid ' + C.border }}>
        {[['form',"📝 Today's Report"], ['history','📋 My Submissions']].map(([t, l]) => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      {tab === 'history' && (
        <div>
          {myLogs.length === 0 && <div style={{ ...S.card, color: C.faint, fontSize: 13, textAlign: 'center', padding: 30 }}>No submissions yet.</div>}
          {myLogs.map((l, i) => (
            <div key={i} style={{ ...S.card, marginBottom: 10, borderLeft: '3px solid ' + (l.approved === false ? C.amber : C.accent) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{l.date}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: l.approved === false ? 'rgba(245,158,11,.12)' : 'rgba(22,163,74,.1)', color: l.approved === false ? C.amber : C.accent, fontWeight: 700 }}>{l.approved === false ? '⏳ Pending approval' : '✅ Approved'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5, fontSize: 11 }}>
                {[['Checked', l.checked], ['Sick', l.sick], ['Deaths', l.deaths], ['Births', l.births], ['Water', l.water ? '✓' : '✗'], ['Cleaned', l.cleaned ? '✓' : '✗']].map(([lbl, v]) => (
                  <div key={lbl} style={{ background: C.elevated, borderRadius: 5, padding: '4px 7px' }}>
                    <div style={{ color: C.faint, fontSize: 9 }}>{lbl}</div>
                    <div style={{ color: (lbl === 'Sick' || lbl === 'Deaths') && v > 0 ? C.red : C.text, marginTop: 1 }}>{v}</div>
                  </div>
                ))}
              </div>
              {l.notes && <div style={{ fontSize: 11, color: C.faint, marginTop: 6, fontStyle: 'italic' }}>"{l.notes}"</div>}
            </div>
          ))}
        </div>
      )}

      {tab === 'form' && (
        <div>
          <div style={S.h1}>📝 Daily Report — {toDay()}</div>
          <div style={S.card}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {[['checked','Pigs Checked'], ['sick','Sick Pigs'], ['deaths','Deaths'], ['births','New Births']].map(([k, l]) => (
                <div key={k}><label style={S.lbl}>{l}</label><input type="number" min="0" value={form[k]} onChange={e => setForm({ ...form, [k]: parseInt(e.target.value) || 0 })} style={S.inp} /></div>
              ))}
              {[['water','Water OK?'], ['cleaned','Pen Cleaned?']].map(([k, l]) => (
                <div key={k}><label style={S.lbl}>{l}</label><select value={form[k] ? 'yes' : 'no'} onChange={e => setForm({ ...form, [k]: e.target.value === 'yes' })} style={S.inp}><option value="yes">Yes ✓</option><option value="no">No ✗</option></select></div>
              ))}
            </div>
            {form.deaths > 0 && (
              <div style={{ marginBottom: 12, padding: '10px 13px', background: 'rgba(239,68,68,.05)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 9 }}>
                <label style={{ ...S.lbl, color: C.red }}>💀 Capital Loss from {form.deaths} Death(s) (RWF)</label>
                <input type="number" min="0" placeholder="Enter total loss amount in RWF" value={form.deathLossAmount} onChange={e => setForm({ ...form, deathLossAmount: e.target.value })} style={S.inp} />
                <div style={{ fontSize: 10, color: C.faint, marginTop: 4 }}>This amount will be deducted from business capital.</div>
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label style={S.lbl}>Notes</label>
              <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any observations, sick pig details, unusual events…" style={{ ...S.inp, resize: 'vertical' }} />
            </div>
            <button style={{ ...S.btn(), width: '100%', padding: 12, fontSize: 14, opacity: saving ? 0.6 : 1 }} onClick={() => !saving && setConfirm(true)} disabled={saving}>
              {saving ? '⏳ Submitting…' : 'Submit Report →'}
            </button>
            {user.role !== 'admin' && <div style={{ fontSize: 11, color: C.muted, marginTop: 8, textAlign: 'center', padding: '7px', background: 'rgba(245,158,11,.06)', borderRadius: 6, border: '1px solid rgba(245,158,11,.2)' }}>⏳ Pending admin approval before it counts in records</div>}
          </div>
        </div>
      )}
    </div>
  );
}
