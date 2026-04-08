import { useState } from 'react'

const initialCapital = [
  { id: 1, name: 'Pig Shed Construction', type: 'Asset', value: 500000, date: '2025-01-10', status: 'Active', notes: 'Main piggery building' },
  { id: 2, name: 'Breeding Stock (10 sows)', type: 'Asset', value: 300000, date: '2025-03-15', status: 'Active', notes: '10 quality sows' },
  { id: 3, name: 'Feed Mill Equipment', type: 'Asset', value: 120000, date: '2025-06-01', status: 'Active', notes: 'Grinder & mixer' },
  { id: 4, name: 'Bank Loan', type: 'Liability', value: 200000, date: '2025-01-01', status: 'Active', notes: 'BPR Bank, 12% p.a.' },
  { id: 5, name: 'Supplier Credit', type: 'Liability', value: 35000, date: '2026-03-20', status: 'Active', notes: 'Feed supplier balance' },
]

const typeColors = {
  Asset: '#4a8c3f',
  Liability: '#c0392b',
  Investment: '#3498db',
}

export default function CapitalManagement() {
  const [items, setItems] = useState(initialCapital)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('All')
  const [form, setForm] = useState({
    name: '',
    type: 'Asset',
    value: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Active',
    notes: ''
  })

  const totalAssets = items.filter(i => i.type === 'Asset').reduce((a, i) => a + i.value, 0)
  const totalLiabilities = items.filter(i => i.type === 'Liability').reduce((a, i) => a + i.value, 0)
  const netWorth = totalAssets - totalLiabilities
  const totalInvestment = items.filter(i => i.type === 'Investment').reduce((a, i) => a + i.value, 0)

  const handleAdd = () => {
    if (!form.name || !form.value) return
    setItems([{ id: Date.now(), ...form, value: +form.value }, ...items])
    setForm({ name: '', type: 'Asset', value: '', date: new Date().toISOString().split('T')[0], status: 'Active', notes: '' })
    setShowForm(false)
  }

  const filtered = filter === 'All' ? items : items.filter(i => i.type === filter)
  const fmt = (n) => 'RWF ' + n.toLocaleString()

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem' }}>💼 Capital</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Assets, liabilities & net worth</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: 'var(--green-light)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '0.6rem 1.1rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          + Add
        </button>
      </div>

      {/* Net Worth Banner */}
      <div style={{
        background: netWorth >= 0 ? 'linear-gradient(135deg, #1a3320, #2d5a27)' : 'linear-gradient(135deg, #2e1a1a, #5a2727)',
        borderRadius: '16px',
        padding: '1.4rem',
        marginBottom: '1.2rem',
        textAlign: 'center',
        border: '1px solid #2a3d28'
      }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Farm Net Worth</div>
        <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Playfair Display, serif', color: 'var(--accent)', margin: '0.3rem 0' }}>
          {fmt(netWorth)}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
          Assets: <span style={{ color: '#4a8c3f' }}>{fmt(totalAssets)}</span> &nbsp;|&nbsp;
          Liabilities: <span style={{ color: '#c0392b' }}>{fmt(totalLiabilities)}</span>
        </div>
      </div>

      {/* Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginBottom: '1.3rem' }}>
        {[
          { label: 'Assets', value: items.filter(i => i.type === 'Asset').length, color: '#4a8c3f', icon: '🏗️' },
          { label: 'Liabilities', value: items.filter(i => i.type === 'Liability').length, color: '#c0392b', icon: '💳' },
          { label: 'Investments', value: items.filter(i => i.type === 'Investment').length, color: '#3498db', icon: '📈' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--card)', border: '1px solid #2a3d28', borderRadius: '12px', padding: '0.9rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem' }}>
        {['All', 'Asset', 'Liability', 'Investment'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '0.4rem 0.9rem',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.78rem',
            background: filter === f ? 'var(--accent)' : 'var(--card)',
            color: filter === f ? '#111' : 'var(--muted)'
          }}>{f}</button>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{ background: 'var(--card)', border: '1px solid #2a3d28', borderRadius: '14px', padding: '1.2rem', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>New Capital Item</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            {[
              { label: 'Item Name', key: 'name', type: 'text', placeholder: 'e.g. Water Tank' },
              { label: 'Value (RWF)', key: 'value', type: 'number', placeholder: 'e.g. 50000' },
              { label: 'Date Acquired', key: 'date', type: 'date' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  style={{ width: '100%', background: '#111a0f', border: '1px solid #2a3d28', borderRadius: '8px', padding: '0.5rem 0.7rem', color: 'var(--text)', fontSize: '0.9rem' }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                style={{ width: '100%', background: '#111a0f', border: '1px solid #2a3d28', borderRadius: '8px', padding: '0.5rem 0.7rem', color: 'var(--text)', fontSize: '0.9rem' }}>
                <option>Asset</option>
                <option>Liability</option>
                <option>Investment</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>Notes</label>
              <input type="text" placeholder="Description..." value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                style={{ width: '100%', background: '#111a0f', border: '1px solid #2a3d28', borderRadius: '8px', padding: '0.5rem 0.7rem', color: 'var(--text)', fontSize: '0.9rem' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.7rem', marginTop: '1rem' }}>
            <button onClick={handleAdd} style={{ background: 'var(--accent)', color: '#111', border: 'none', borderRadius: '8px', padding: '0.6rem 1.2rem', fontWeight: 700, cursor: 'pointer' }}>Save</button>
            <button onClick={() => setShowForm(false)} style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid #2a3d28', borderRadius: '8px', padding: '0.6rem 1.2rem', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {filtered.map(item => (
          <div key={item.id} style={{
            background: 'var(--card)',
            border: '1px solid #2a3d28',
            borderRadius: '12px',
            padding: '0.9rem 1.1rem',
            borderLeft: `4px solid ${typeColors[item.type] || '#4a8c3f'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                  {item.date} · {item.type}
                </div>
                {item.notes && <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>💬 {item.notes}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: typeColors[item.type], fontSize: '1rem' }}>{fmt(item.value)}</div>
                <div style={{
                  fontSize: '0.7rem',
                  marginTop: '0.3rem',
                  background: typeColors[item.type] + '22',
                  color: typeColors[item.type],
                  borderRadius: '10px',
                  padding: '0.15rem 0.5rem'
                }}>{item.status}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
