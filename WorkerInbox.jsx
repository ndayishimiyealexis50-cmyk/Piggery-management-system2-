// pages/WorkerInbox.jsx
// Worker message inbox — function WorkerInbox()
// Props: { messages, setMessages, user }

import { useEffect, useRef, useState } from 'react';
import { S, C } from '../utils/styles';
import { toDay, getOnlineFarmData } from '../utils/helpers';

export default function WorkerInbox({ messages, setMessages, user }) {
  const [checking,  setChecking]  = useState(false);
  const [lastCheck, setLastCheck] = useState('');
  const [newCount,  setNewCount]  = useState(0);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all'); // 'all'|'today'|'week'
  const [expanded,  setExpanded]  = useState(null);
  const prevLen   = useRef(messages.length);
  const bottomRef = useRef(null);
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('farmiq_read_msgs') || '[]')); }
    catch { return new Set(); }
  });

  function markRead(id) {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem('farmiq_read_msgs', JSON.stringify([...next])); } catch (e) {}
      return next;
    });
  }

  useEffect(() => {
    let active = true;
    async function poll() {
      setChecking(true);
      try {
        const farm = await getOnlineFarmData();
        if (farm && Array.isArray(farm.messages) && active) {
          const fresh = farm.messages;
          if (fresh.length > prevLen.current) {
            setNewCount(fresh.length - prevLen.current);
            setTimeout(() => setNewCount(0), 5000);
          }
          prevLen.current = fresh.length;
          if (setMessages) setMessages(fresh);
          setLastCheck(new Date().toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (e) {}
      if (active) setChecking(false);
    }
    poll();
    const t = setInterval(poll, 4000);
    return () => { active = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const today   = toDay();
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().slice(0, 10);

  let filtered = messages.slice();
  if (filter === 'today') filtered = filtered.filter(m => m.date === today);
  if (filter === 'week')  filtered = filtered.filter(m => m.date >= weekStr);
  if (search.trim()) filtered = filtered.filter(m => (m.text + m.from).toLowerCase().includes(search.trim().toLowerCase()));
  filtered = filtered.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const unread      = messages.filter(m => !readIds.has(m.id || String(m.date + m.time)));
  const unreadCount = unread.length;

  // Group by date
  const grouped = {};
  filtered.forEach(m => {
    const d = m.date || 'Unknown';
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(m);
  });

  function dateLbl(d) {
    if (d === today) return 'Today';
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    if (d === yest.toISOString().slice(0, 10)) return 'Yesterday';
    return new Date(d).toLocaleDateString('en-RW', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxHeight: 760 }}>
      {/* Header */}
      <div style={{ marginBottom: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <div style={S.h1}>💬 Message History</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {unreadCount > 0 && (
              <span style={{ padding: '2px 9px', borderRadius: 10, background: 'rgba(239,68,68,.12)', color: C.red, fontWeight: 700, fontSize: 11 }}>{unreadCount} unread</span>
            )}
            {checking && (
              <span style={{ fontSize: 11, color: C.faint, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="spin" style={{ width: 10, height: 10, border: '2px solid #cbd5e1', borderTop: '2px solid #16a34a', borderRadius: '50%', display: 'inline-block' }} />Live
              </span>
            )}
            {lastCheck && !checking && <span style={{ fontSize: 10, color: C.faint }}>✓ {lastCheck}</span>}
          </div>
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>{messages.length} message{messages.length !== 1 ? 's' : ''} from admin · Auto-refreshes</div>

        {newCount > 0 && (
          <div style={{ padding: '9px 14px', background: 'linear-gradient(135deg,rgba(22,163,74,.15),rgba(16,185,129,.08))', border: '1px solid rgba(22,163,74,.4)', borderRadius: 9, marginBottom: 10, fontSize: 13, color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🔔</span> {newCount} new message{newCount > 1 ? 's' : ''} just arrived!
          </div>
        )}

        {/* Search + filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C.faint, pointerEvents: 'none' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages…" style={{ ...S.inp, paddingLeft: 30, fontSize: 12 }} />
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            {[['all','All'], ['today','Today'], ['week','This Week']].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 11, background: filter === v ? 'linear-gradient(135deg,#16a34a,#10b981)' : 'rgba(22,163,74,.08)', color: filter === v ? '#fff' : '#16a34a' }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f0f4f8', borderRadius: 12, padding: '12px 10px', border: '1px solid #e2e8f0' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.faint }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{search ? 'No messages match your search' : 'No messages yet'}</div>
            <div style={{ fontSize: 12 }}>{search ? 'Try a different keyword' : "Admin hasn't sent any messages"}</div>
          </div>
        )}

        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: 10, color: C.faint, fontWeight: 700, letterSpacing: 0.5, whiteSpace: 'nowrap', padding: '2px 10px', background: '#e8edf5', borderRadius: 10 }}>{dateLbl(date)}</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>
            {msgs.map(m => {
              const msgId   = m.id || String(m.date + m.time);
              const isUnread= !readIds.has(msgId);
              const isExp   = expanded === msgId;
              const isAI    = m.aiGenerated;
              const isWelc  = m.welcome || m.system;
              return (
                <div key={msgId} style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div
                    onClick={() => { setExpanded(isExp ? null : msgId); markRead(msgId); }}
                    style={{
                      maxWidth: '88%', cursor: 'pointer',
                      background: isWelc ? 'linear-gradient(135deg,#fffbeb,#fef3c7)' : isUnread ? 'linear-gradient(135deg,#ffffff,#f0fdf4)' : '#ffffff',
                      border: isWelc ? '1px solid rgba(245,158,11,.45)' : isUnread ? '1px solid rgba(22,163,74,.4)' : '1px solid #e2e8f0',
                      borderRadius: '4px 16px 16px 16px',
                      padding: '10px 14px',
                      boxShadow: isUnread ? '0 2px 10px rgba(22,163,74,.12)' : '0 1px 4px rgba(0,0,0,.06)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, flexWrap: 'wrap' }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: isWelc ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' : 'linear-gradient(135deg,#16a34a,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: isWelc ? 15 : 12, fontWeight: 700, flexShrink: 0 }}>
                        {isWelc ? '🌱' : 'A'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 12, color: isWelc ? '#d97706' : '#16a34a' }}>{m.from || 'Admin'}</div>
                        <div style={{ fontSize: 10, color: C.faint }}>{m.date} · {m.time || ''}</div>
                      </div>
                      {isWelc && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 6, background: 'rgba(245,158,11,.12)', color: '#d97706', fontWeight: 700 }}>👋 Welcome</span>}
                      {isAI && !isWelc && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 6, background: 'rgba(124,58,237,.1)', color: '#7c3aed', fontWeight: 700 }}>❆ AI</span>}
                      {isUnread && <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: isWelc ? '#f59e0b' : '#16a34a', flexShrink: 0 }} />}
                    </div>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.75, whiteSpace: 'pre-wrap', ...(isExp ? {} : { overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }) }}>{m.text}</div>
                    {m.text && m.text.length > 160 && <div style={{ fontSize: 10, color: '#16a34a', marginTop: 4, fontWeight: 600 }}>{isExp ? '▲ Show less' : '▼ Read more'}</div>}
                    {m.waDelivered && <div style={{ fontSize: 10, color: '#128C7E', marginTop: 5 }}>📱 Also sent via WhatsApp</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Footer stats */}
      <div style={{ flexShrink: 0, marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: C.faint }}>
        <span>📨 {messages.length} total</span>
        <span>📅 {messages.filter(m => m.date === today).length} today</span>
        <span>✅ {messages.length - unreadCount} read</span>
        {unreadCount > 0 && <span style={{ color: C.red, fontWeight: 700 }}>● {unreadCount} unread</span>}
      </div>
    </div>
  );
}
