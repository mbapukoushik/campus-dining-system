import React, { useEffect, useState } from 'react';
import { fetchVendors } from '../services/api';
import { ShieldCheck, Store, ToggleLeft, ToggleRight, Star, Clock } from 'lucide-react';
import api from '../services/api';

const AdminDashboard = () => {
  const [vendors, setVendors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState(null); // vendor _id being toggled

  const loadVendors = () => {
    setLoading(true);
    fetchVendors()
      .then(res => setVendors(res.data))
      .catch(err => console.error('Failed to load vendors', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadVendors(); }, []);

  const toggleVendorStatus = async (vendor) => {
    setToggling(vendor._id);
    try {
      await api.patch(`/api/admin/vendors/${vendor._id}/toggle-status`, {
        is_currently_open: !vendor.is_currently_open,
      });
      setVendors(prev => prev.map(v =>
        v._id === vendor._id ? { ...v, is_currently_open: !v.is_currently_open } : v
      ));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle vendor status');
    } finally {
      setToggling(null);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div><p>Loading admin panel...</p></div>;

  const openCount = vendors.filter(v => v.is_currently_open).length;

  return (
    <div className="page-container">
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1.5rem 2rem', background: 'linear-gradient(135deg, #1a1714 0%, #3d2c20 100%)', borderRadius: 'var(--radius)', color: 'white' }}>
        <ShieldCheck size={36} style={{ color: '#e8a000', flexShrink: 0 }} />
        <div>
          <h1 style={{ color: 'white', margin: 0, fontSize: '1.8rem' }}>Admin Mission Control</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            Submitted to: Dr. Sonali Mondal · SRM University AP · Software Engineering & Management
          </p>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-num">{vendors.length}</div>
          <div className="stat-label">Total Vendors</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: 'var(--green)' }}>{openCount}</div>
          <div className="stat-label">Currently Open</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: 'var(--red)' }}>{vendors.length - openCount}</div>
          <div className="stat-label">Currently Closed</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">
            {vendors.length > 0
              ? (vendors.reduce((sum, v) => sum + (v.avg_rating || 0), 0) / vendors.length).toFixed(1)
              : '—'}
          </div>
          <div className="stat-label">Avg Platform Rating</div>
        </div>
      </div>

      {/* ── Vendor Table ── */}
      <h3 className="section-label">Vendor Management</h3>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-soft)', borderBottom: '2px solid var(--border)' }}>
              {['Vendor', 'Location', 'Rating', 'Wait Time', 'Status', 'Action'].map(h => (
                <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vendors.map((v, idx) => (
              <tr key={v._id} style={{ borderBottom: idx < vendors.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <td style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Store size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600 }}>{v.stall_name}</span>
                  </div>
                </td>
                <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {v.location_tag}
                </td>
                <td style={{ padding: '1rem 1.25rem' }}>
                  {v.avg_rating ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Star size={14} fill="#e8a000" style={{ color: '#e8a000' }} />
                      <strong>{v.avg_rating}</strong>
                    </span>
                  ) : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>—</span>}
                </td>
                <td style={{ padding: '1rem 1.25rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                    <Clock size={13} />
                    {v.current_wait_time ? `${v.current_wait_time} min` : '—'}
                  </span>
                </td>
                <td style={{ padding: '1rem 1.25rem' }}>
                  <span className={`badge ${v.is_currently_open ? 'badge-green' : 'badge-red'}`}>
                    {v.is_currently_open ? '● Open' : '○ Closed'}
                  </span>
                </td>
                <td style={{ padding: '1rem 1.25rem' }}>
                  <button
                    onClick={() => toggleVendorStatus(v)}
                    disabled={toggling === v._id}
                    style={{
                      background: v.is_currently_open ? 'var(--red-bg)' : 'var(--green-bg)',
                      color: v.is_currently_open ? 'var(--red)' : 'var(--green)',
                      border: `1px solid ${v.is_currently_open ? 'var(--red-border)' : 'var(--green-border)'}`,
                      padding: '0.35rem 0.9rem', fontSize: '0.8rem', fontWeight: 600,
                    }}
                  >
                    {toggling === v._id ? (
                      <div className="spinner" style={{ width: 14, height: 14 }}></div>
                    ) : v.is_currently_open ? (
                      <><ToggleRight size={14} /> Close</>
                    ) : (
                      <><ToggleLeft size={14} /> Open</>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
