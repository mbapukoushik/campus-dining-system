import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, Clock, MapPin, ChevronRight, Star } from 'lucide-react';
import { fetchVendors } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { getVendorImage } from '../assets/vendorImages';

const StarDisplay = ({ rating }) => {
  if (!rating) return <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>No rating yet</span>;
  const full = Math.floor(rating);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={13} fill={i <= full ? '#e8a000' : 'none'} style={{ color: i <= full ? '#e8a000' : '#d1c4a0' }} />
      ))}
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e8a000' }}>{rating.toFixed(1)}</span>
    </div>
  );
};

const StudentDashboard = () => {
  const { user }  = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    fetchVendors()
      .then(res => setVendors(res.data))
      .catch(err => console.error('Failed to load vendors', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading-page"><div className="spinner"></div><p>Loading dining options...</p></div>;
  }

  const filtered = filter === 'open' ? vendors.filter(v => v.is_currently_open)
                 : filter === 'closed' ? vendors.filter(v => !v.is_currently_open)
                 : vendors;

  const openCount   = vendors.filter(v => v.is_currently_open).length;
  const closedCount = vendors.length - openCount;
  const firstName   = user?.email?.split('@')[0]?.split('_')[0];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Campus Dining</h1>
        <p>
          {firstName && `Welcome, ${firstName}. `}
          {openCount} vendors open · {closedCount} closed near SRM University AP, Amaravati
        </p>
      </div>

      {/* ── Filter Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { key: 'all',    label: `All (${vendors.length})` },
          { key: 'open',   label: `Open (${openCount})` },
          { key: 'closed', label: `Closed (${closedCount})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '0.4rem 1rem', borderRadius: '999px', border: '1.5px solid',
            borderColor: filter === f.key ? 'var(--accent)' : 'var(--border)',
            background: filter === f.key ? 'var(--accent)' : 'transparent',
            color: filter === f.key ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
          }}>{f.label}</button>
        ))}
      </div>

      <div className="vendor-grid">
        {filtered.length === 0 ? (
          <div className="empty-state card"><Store className="empty-state-icon" /><h3>No vendors found</h3></div>
        ) : (
          filtered.map(v => {
            const img = getVendorImage(v.stall_name);
            return (
              <Link to={`/vendors/${v._id}`} key={v._id} className="card card-hover flex-col" style={{ textDecoration: 'none', opacity: v.is_currently_open ? 1 : 0.72, padding: 0, overflow: 'hidden' }}>

                {/* Vendor Image */}
                {img ? (
                  <div style={{ height: '160px', overflow: 'hidden', borderRadius: 'var(--radius) var(--radius) 0 0' }}>
                    <img src={img} alt={v.stall_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ height: '100px', background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius) var(--radius) 0 0' }}>
                    <Store size={32} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                )}

                {/* Card Content */}
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.05rem', lineHeight: 1.3, margin: 0 }}>{v.stall_name}</h2>
                    <span className={`badge ${v.is_currently_open ? 'badge-green' : 'badge-red'}`} style={{ flexShrink: 0, fontSize: '0.7rem' }}>
                      {v.is_currently_open ? '● Open' : '○ Closed'}
                    </span>
                  </div>

                  <div className="flex-row" style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                    <MapPin size={12} /><span>{v.location_tag}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                    <StarDisplay rating={v.avg_rating} />
                    <div className="flex-row" style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', gap: '0.25rem' }}>
                      <Clock size={12} />
                      <span>{v.current_wait_time ? `${v.current_wait_time} min` : '—'}</span>
                    </div>
                  </div>

                  <div className="flex-row" style={{ color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.75rem' }}>
                    <span>View Menu & Reviews</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
