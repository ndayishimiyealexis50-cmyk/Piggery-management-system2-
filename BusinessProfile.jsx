// pages/BusinessProfile.jsx
// Business profile settings — function BusinessProfileSettings()
// Props: none (reads/writes from localStorage via getBusinessProfile / setBusinessProfile)

import { useEffect, useState } from 'react';
import { S, C } from '../utils/styles';
import { getBusinessProfile, setBusinessProfile } from '../utils/helpers';

export default function BusinessProfile() {
  const [profileVersion, setProfileVersion] = useState(0);
  const saved = getBusinessProfile();
  const [form, setForm] = useState({
    farmName: saved.farmName || '', ownerName: saved.ownerName || '',
    address: saved.address || '', district: saved.district || '',
    province: saved.province || '', phone: saved.phone || '',
    email: saved.email || '', tin: saved.tin || '',
    bankName: saved.bankName || '', bankAccount: saved.bankAccount || '',
    established: saved.established || '', licenseNo: saved.licenseNo || '',
  });
  const [saved2, setSaved2] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onBizUpdate() { const fresh = getBusinessProfile(); setForm(f => ({ ...f, ...fresh })); setProfileVersion(v => v + 1); }
    window.addEventListener('bizProfileUpdated', onBizUpdate);
    return () => window.removeEventListener('bizProfileUpdated', onBizUpdate);
  }, []);

  async function save() {
    setSaving(true);
    try { await setBusinessProfile(form); } catch (e) {}
    setSaving(false); setSaved2(true); setProfileVersion(v => v + 1);
    setTimeout(() => setSaved2(false), 3000);
  }

  function field(label, key, placeholder) {
    return (
      <div key={key}>
        <label style={S.lbl}>{label}</label>
        <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} style={S.inp} />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={S.h1}>🏢 Business Profile</div>
      <div style={S.sub}>This information appears on all PDF reports, payslips, and bank-ready documents</div>

      {saved2 && <div style={{ padding: '10px 14px', background: 'rgba(22,163,74,.1)', border: '1px solid rgba(22,163,74,.3)', borderRadius: 9, marginBottom: 14, color: C.accent, fontWeight: 600 }}>✅ Business profile saved! All PDFs will now include this information.</div>}

      {/* Farm identity */}
      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, marginBottom: 14 }}>🏪 Farm Identity</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1/-1' }}>{field('Farm / Business Name *', 'farmName', 'e.g. Ndayishimiye Pig Farm Ltd')}</div>
          {field('Owner / Manager Name *', 'ownerName', 'e.g. Alexis Ndayishimiye')}
          {field('Year Established', 'established', 'e.g. 2020')}
          {field('Business License No.', 'licenseNo', 'e.g. RDB/2020/001234')}
          {field('TIN (Tax ID Number)', 'tin', 'e.g. 123456789')}
        </div>
      </div>

      {/* Address */}
      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.blue, marginBottom: 14 }}>📍 Physical Address</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1/-1' }}>{field('Street / Village Address *', 'address', 'e.g. KG 12 Ave, Kacyiru')}</div>
          {field('District', 'district', 'e.g. Gasabo')}
          {field('Province', 'province', 'e.g. Kigali City')}
        </div>
      </div>

      {/* Contact */}
      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.purple, marginBottom: 14 }}>📞 Contact Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {field('Phone Number', 'phone', 'e.g. +250 788 123 456')}
          {field('Email Address', 'email', 'e.g. farm@example.com')}
        </div>
      </div>

      {/* Banking */}
      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.amber, marginBottom: 14 }}>🏦 Banking Details (for loan documents)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {field('Bank Name', 'bankName', 'e.g. Bank of Kigali')}
          {field('Account Number', 'bankAccount', 'e.g. 00012345678')}
        </div>
      </div>

      {/* PDF preview */}
      <div style={{ ...S.card, background: 'rgba(22,163,74,.04)', border: '1px solid rgba(22,163,74,.2)', marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>📄 <strong>Preview on PDF header:</strong></div>
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: C.text, lineHeight: 1.8, background: '#fff', padding: '12px 14px', borderRadius: 8, border: '1px solid ' + C.border }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{form.farmName || '[Farm Name]'}</div>
          <div>{form.ownerName ? `Owner: ${form.ownerName}` : ''}</div>
          <div>{form.address || '[Address]'}{form.district ? `, ${form.district}` : ''}{form.province ? `, ${form.province}` : ''}, Rwanda</div>
          <div>Tel: {form.phone || '[Phone]'} {form.email ? `| Email: ${form.email}` : ''}</div>
          {form.tin && <div>TIN: {form.tin}</div>}
          {form.licenseNo && <div>License: {form.licenseNo}</div>}
        </div>
      </div>

      <button onClick={save} disabled={saving} style={{ ...S.btn(), width: '100%', padding: 13, fontSize: 14, opacity: saving ? 0.7 : 1 }}>
        {saving ? '⏳ Saving…' : '💾 Save Business Profile →'}
      </button>
    </div>
  );
}
