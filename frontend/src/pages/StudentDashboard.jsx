import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, Clock, MapPin, ChevronRight } from 'lucide-react';
import { fetchVendors } from '../services/api';

const StudentDashboard = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors()
      .then((res) => {
        setVendors(res.data);
      })
      .catch((err) => console.error("Failed to load vendors", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p>Browsing campus dining options...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Vendor Dashboard</h1>
        <p>Discover food across the SRM University AP campus</p>
      </div>

      <div className="section-label">Available Vendors</div>
      
      <div className="vendor-grid">
        {vendors.length === 0 ? (
          <div className="empty-state card">
            <Store className="empty-state-icon" />
            <h3>No vendors found</h3>
            <p>Check back later or try refreshing the page.</p>
          </div>
        ) : (
          vendors.map((v) => (
            <Link to={`/vendors/${v._id}`} key={v._id} className="card card-hover flex-col">
              <div className="flex-col" style={{ gap: '0.25rem' }}>
                <h2 style={{ fontSize: '1.4rem' }}>{v.stall_name}</h2>
                <div className="flex-row" style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                  <MapPin size={14} />
                  <span>{v.location_tag}</span>
                </div>
              </div>

              <div className="divider" style={{ margin: '0.5rem 0' }}></div>
              
              <div className="flex-row" style={{ justifyContent: 'space-between' }}>
                <span className={`badge ${v.is_currently_open && v.is_within_hours ? 'badge-green' : 'badge-red'}`}>
                  {v.is_currently_open && v.is_within_hours ? '● Open Now' : '○ Closed'}
                </span>
                
                <div className="flex-row" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <Clock size={16} />
                  <span>{v.current_wait_time || 0} mins</span>
                </div>
              </div>

              <div className="flex-row" style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem' }}>
                <span>View Menu & Reviews</span>
                <ChevronRight size={16} />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
