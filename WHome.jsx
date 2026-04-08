// pages/WHome.jsx
// Worker dashboard — function WHome()
// Props: { user, logs, feeds, sales, messages, assessments, pendingPigs, tasks, expenses, advances, bonusRequests, salaries }

import { S, C } from '../utils/styles';
import { toDay, fmtRWF } from '../utils/helpers';
import WorkerNotifPanel from '../components/WorkerNotifPanel';

export default function WHome({ user, logs, feeds, sales, messages, assessments, pendingPigs, tasks, expenses, advances, bonusRequests, salaries }) {
  const myId = user.uid || user.id;
  const ml = logs.filter(l => l.workerId === myId || l.worker === user.name);
  const mf = feeds.filter(f => f.workerId === myId || f.worker === user.name);
  const ms = sales.filter(s => s.workerId === myId || s.worker === user.name);
  const myExp = (expenses || []).filter(e => e.workerId === myId || e.worker === user.name);
  const adminMessages = [...messages].reverse();
  const latest = adminMessages[0] || null;

  const myPendingLogs        = ml.filter(l => l.approved === false);
  const myPendingFeeds       = mf.filter(f => f.approved === false);
  const myPendingSales       = ms.filter(s => s.approved === false);
  const myPendingExp         = myExp.filter(e => e.approved === false);
  const myPendingAssessments = (assessments || []).filter(a => (a.workerId === myId || a.worker === user.name) && a.approved === false);
  const myPendingPigs        = (pendingPigs || []).filter(p => (p.submittedBy === myId || p.submittedByName === user.name) && !p.approved && !p.rejected);
  const totalPending         = myPendingLogs.length + myPendingFeeds.length + myPendingSales.length + myPendingExp.length + myPendingAssessments.length + myPendingPigs.length;

  const myOverdueTasks = (tasks || []).filter(t =>
    (t.workerId === myId || t.workerId === user.id) && t.status === 'pending' && t.dueDate &&
    (new Date(t.dueDate) - new Date()) / (1000 * 60 * 60 * 24) < 0
  );
  const myDueTasks = (tasks || []).filter(t =>
    (t.workerId === myId || t.workerId === user.id) && t.status === 'pending' && t.dueDate &&
    (new Date(t.dueDate) - new Date()) / (1000 * 60 * 60 * 24) >= 0 &&
    (new Date(t.dueDate) - new Date()) / (1000 * 60 * 60 * 24) <= 2
  );
  const todayDone = ml.some(l => l.date === toDay());
  const myRevenue = ms.reduce((s, l) => s + (l.total || 0), 0);

  // Monthly activity sparkline (last 6 months)
  const actMap = {};
  [...ml, ...mf, ...ms].forEach(x => {
    const m = (x.date || '').slice(0, 7);
    if (m) actMap[m] = (actMap[m] || 0) + 1;
  });
  const actMonths = Object.entries(actMap).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  const maxAct = Math.max(...actMonths.map(([, v]) => v), 1);
  const MON_LBL = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const kpis = [
    { icon: '📝', label: 'Daily Reports', value: ml.length,
      sub: todayDone ? '✅ Done today' : '⚠️ Due today',
      color: todayDone ? C.accent : C.amber,
      bg:  todayDone ? 'rgba(22,163,74,.07)' : 'rgba(245,158,11,.07)',
      border: todayDone ? 'rgba(22,163,74,.2)' : 'rgba(245,158,11,.2)' },
    { icon: '🌾', label: 'Feeding Logs', value: mf.length, sub: 'all time',
      color: C.amber, bg: 'rgba(245,158,11,.06)', border: 'rgba(245,158,11,.18)' },
    { icon: '🏷️', label: 'Sales', value: ms.length, sub: fmtRWF(myRevenue),
      color: '#10b981', bg: 'rgba(16,185,129,.06)', border: 'rgba(16,185,129,.18)' },
    { icon: '✅', label: 'Tasks Done',
      value: (tasks || []).filter(t => (t.workerId === myId || t.workerId === user.id) && t.status === 'done').length,
      sub: (tasks || []).filter(t => (t.workerId === myId || t.workerId === user.id) && t.status === 'pending').length + ' pending',
      color: C.blue, bg: 'rgba(37,99,235,.05)', border: 'rgba(37,99,235,.15)' },
  ];

  return (
    <div className="fade-in">
      {/* Welcome header */}
      <div style={{ background: 'linear-gradient(135deg,#0c1f18 0%,#122d20 55%,#0e2218 100%)', borderRadius: 14, padding: '20px 22px', marginBottom: 16, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,.18)' }}>
        <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, background: 'radial-gradient(circle,rgba(74,222,128,.12) 0%,transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg,rgba(74,222,128,.22),rgba(22,163,74,.12))', border: '1.5px solid rgba(74,222,128,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>👷</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>Welcome, {user.name}!</div>
            <div style={{ fontSize: 11, color: 'rgba(74,222,128,.6)', marginTop: 2 }}>{toDay()} · FarmIQ Worker Portal</div>
          </div>
        </div>
      </div>

      {/* Notification panel */}
      <WorkerNotifPanel user={user} messages={messages} salaries={salaries || []} advances={advances || []} bonusRequests={bonusRequests || []} />

      {/* Latest admin message */}
      {latest && (
        <div style={{ padding: '12px 14px', background: 'rgba(22,163,74,.07)', border: '1px solid rgba(22,163,74,.28)', borderRadius: 10, marginBottom: 10, fontSize: 13 }}>
          <div style={{ fontWeight: 700, color: C.accent, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 15 }}>📢</span> From {latest.from}:
          </div>
          <div style={{ color: C.text, lineHeight: 1.6 }}>{latest.text}</div>
          <div style={{ fontSize: 10, color: C.faint, marginTop: 4 }}>{latest.date}{latest.time ? ' · ' + latest.time : ''}</div>
        </div>
      )}

      {/* Alerts */}
      {!todayDone && (
        <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 9, marginBottom: 8, color: C.amber, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚠️</span> You haven't submitted your daily report today.
        </div>
      )}
      {myOverdueTasks.length > 0 && (
        <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 9, marginBottom: 8, color: C.red, fontSize: 13 }}>
          🔴 {myOverdueTasks.length} overdue task{myOverdueTasks.length > 1 ? 's' : ''} — please complete now.
        </div>
      )}
      {myDueTasks.length > 0 && (
        <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,.07)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 9, marginBottom: 8, color: C.amber, fontSize: 13 }}>
          ⏰ {myDueTasks.length} task{myDueTasks.length > 1 ? 's' : ''} due within 2 days.
        </div>
      )}
      {totalPending > 0 && (
        <div style={{ padding: '10px 14px', background: 'rgba(37,99,235,.06)', border: '1px solid rgba(37,99,235,.2)', borderRadius: 9, marginBottom: 10, color: C.blue, fontSize: 13 }}>
          ⏳ {totalPending} submission{totalPending > 1 ? 's' : ''} awaiting admin approval.
        </div>
      )}

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 11, marginBottom: 14 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: k.bg, border: '1px solid ' + k.border, borderRadius: 12, padding: '13px 13px 11px', boxShadow: '0 1px 5px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{k.icon}</div>
            <div style={{ fontSize: 9, color: C.faint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, lineHeight: 1.1, marginBottom: 3 }}>{k.value}</div>
            <div style={{ fontSize: 10, color: C.faint }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Activity sparkline */}
      {actMonths.length > 1 && (
        <div style={{ ...S.card, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 12 }}>📊 My Activity — Last {actMonths.length} Months</div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 60, paddingBottom: 16, position: 'relative' }}>
            {actMonths.map(([m, v]) => {
              const h = Math.max(Math.round((v / maxAct) * 50), 3);
              const lbl = MON_LBL[parseInt(m.split('-')[1]) - 1];
              return (
                <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ fontSize: 9, color: C.accent, fontWeight: 700 }}>{v}</div>
                  <div style={{ width: '70%', height: h, background: 'linear-gradient(180deg,#4ade80,#16a34a)', borderRadius: '3px 3px 0 0', transition: 'height .5s cubic-bezier(.22,1,.36,1)' }} />
                  <div style={{ fontSize: 9, color: C.faint, position: 'absolute', bottom: 2 }}>{lbl}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
