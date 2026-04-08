import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, Clock, MapPin, ChevronRight, Star } from 'lucide-react';
import { fetchVendors } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const StarDisplay = ({ rating }) => {
  if (!rating) return <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>No rating yet</span>;
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          size={14}
          fill={i <= full ? '#e8a000' : 'none'}
          style={{ color: i <= full || (i === full + 1 && half) ? '#e8a000' : '#d1c4a0' }}
        />
      ))}
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e8a000' }}>{rating.toFixed(1)}</span>
    </div>
  );
};

const StudentDashboard = () => {
  const { user }  = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all'); // 'all' | 'open' | 'closed'

  useEffect(() => {
    fetchVendors()
      .then(res => setVendors(res.data))
      .catch(err => console.error('Failed to load vendors', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p>Loading dining options...</p>
      </div>
    );
  }

  const filtered = filter === 'open'
    ? vendors.filter(v => v.is_currently_open)
    : filter === 'closed'
    ? vendors.filter(v => !v.is_currently_open)
    : vendors;

  const openCount   = vendors.filter(v => v.is_currently_open).length;
  const closedCount = vendors.length - openCount;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Campus Dining</h1>
        <p>
          {user?.email?.split('@')[0] && `Welcome, ${user.email.split('@')[0]}. `}
          {openCount} vendors open · {closedCount} closed near SRM University AP
        </p>
      </div>

      {/* ── Filter Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { key: 'all',    label: `All (${vendors.length})` },
          { key: 'open',   label: `Open (${openCount})` },
          { key: 'closed', label: `Closed (${closedCount})` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '999px',
              border: '1.5px solid',
              borderColor: filter === f.key ? 'var(--accent)' : 'var(--border)',
              background: filter === f.key ? 'var(--accent)' : 'transparent',
              color: filter === f.key ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="vendor-grid">
        {filtered.length === 0 ? (
          <div className="empty-state card">
            <Store className="empty-state-icon" />
            <h3>No vendors found</h3>
            <p>Try another filter or check back later.</p>
          </div>
        ) : (
          filtered.map(v => (
            <Link to={`/vendors/${v._id}`} key={v._id} className="card card-hover flex-col" style={{ textDecoration: 'none', opacity: v.is_currently_open ? 1 : 0.75 }}>

              {/* ── Vendor Name & Status ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', lineHeight: 1.3, margin: 0 }}>{v.stall_name}</h2>
                <span className={`badge ${v.is_currently_open ? 'badge-green' : 'badge-red'}`} style={{ flexShrink: 0, fontSize: '0.7rem' }}>
                  {v.is_currently_open ? '● Open' : '○ Closed'}
                </span>
              </div>

              {/* ── Location ── */}
              <div className="flex-row" style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                <MapPin size={13} /><span>{v.location_tag}</span>
              </div>

              {/* ── Rating & Wait Time ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                <StarDisplay rating={v.avg_rating} />
                <div className="flex-row" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', gap: '0.25rem' }}>
                  <Clock size={13} />
                  <span>{v.current_wait_time || '—'} min wait</span>
                </div>
              </div>

              {/* ── CTA ── */}
              <div className="flex-row" style={{ color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.75rem' }}>
                <span>View Menu & Reviews</span>
                <ChevronRight size={15} />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
