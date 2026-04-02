import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, Clock } from 'lucide-react';
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

  if (loading) return <div className="page-container"><p>Loading vendors...</p></div>;

  return (
    <div className="page-container">
      <h1 className="flex-row"><Store size={32} /> Vendor Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Discover food across the campus</p>

      <div className="vendor-grid">
        {vendors.map((v) => (
          <Link to={`/vendors/${v._id}`} key={v._id} className="card" style={{ display: 'block' }}>
            <h2 style={{ marginTop: 0 }}>{v.name}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{v.cuisine_type} • {v.location}</p>
            
            <div className="flex-row" style={{ marginTop: '1rem', justifyContent: 'space-between' }}>
              <span className={`badge ${v.is_currently_open ? 'badge-success' : 'badge-danger'}`}>
                {v.is_currently_open ? '● Open Now' : '○ Closed'}
              </span>
              
              <div className="flex-row" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Clock size={16} />
                <span>{v.current_wait_time || 0} mins</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default StudentDashboard;
