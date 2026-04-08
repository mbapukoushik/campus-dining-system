import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Clock, Star, ChevronLeft, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchVendorById, fetchVendorMenu, fetchVendorReviews } from '../services/api';

const VendorProfile = () => {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchVendorById(id),
      fetchVendorMenu(id),
      fetchVendorReviews(id)
    ]).then(([vRes, mRes, rRes]) => {
      setVendor(vRes.data);
      setMenu(mRes.data);
      setReviews(rRes.data);
    }).catch(err => console.error("Failed to load vendor profile", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-page"><div className="spinner"></div><p>Loading vendor details...</p></div>;
  if (!vendor) return <div className="page-container"><p>Vendor not found.</p></div>;

  return (
    <div className="page-container">
      <Link to="/" className="btn-ghost btn-sm" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
        <ChevronLeft size={16} /> Back to Dashboard
      </Link>

      <div className="card flex-col" style={{ marginBottom: '2.5rem' }}>
        <div className="flex-col" style={{ gap: '0.5rem' }}>
          <div className="flex-row" style={{ justifyContent: 'space-between' }}>
            <h1>{vendor.stall_name}</h1>
            <span className={`badge ${vendor.is_currently_open && vendor.is_within_hours ? 'badge-green' : 'badge-red'}`}>
              {vendor.is_currently_open && vendor.is_within_hours ? '● Open Now' : '○ Closed'}
            </span>
          </div>
          <div className="flex-row" style={{ color: 'var(--text-tertiary)' }}>
            <MapPin size={16} />
            <span>{vendor.location_tag}</span>
          </div>
        </div>

        <div className="divider"></div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div className="stat-card">
            <div className="stat-num">{vendor.avg_rating || 'N/A'}</div>
            <div className="stat-label">Avg Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{vendor.current_wait_time || 0}</div>
            <div className="stat-label">Wait Time (m)</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{menu.length}</div>
            <div className="stat-label">Menu Items</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '2.5rem' }}>
        <div>
          <h3 className="section-label">Menu Items</h3>
          <div className="flex-col">
            {menu.length === 0 ? (
              <p className="empty-state">No menu items listed.</p>
            ) : (
              menu.map(item => (
                <div key={item._id} className="card flex-row" style={{ justifyContent: 'space-between' }}>
                  <div className="flex-col" style={{ gap: '0.25rem' }}>
                    <div className="flex-row">
                      <span style={{ fontWeight: 600 }}>{item.item_name}</span>
                      {item.dietary_tag && (
                        <span className={`badge btn-sm ${item.dietary_tag === 'veg' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.65rem' }}>
                          {item.dietary_tag}
                        </span>
                      )}
                    </div>
                    <span className="tag">{item.category}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--accent)' }}>₹{item.price}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h3 className="section-label">Recent Reviews</h3>
          <div className="card">
            {reviews.length === 0 ? (
              <p className="empty-state">No reviews yet.</p>
            ) : (
              reviews.map(review => (
                <div key={review._id} className="review-item">
                  <div className="flex-row" style={{ marginBottom: '0.5rem' }}>
                    <div className="stars">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < review.rating ? 'star-filled' : 'star-empty'} fill={i < review.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem' }}>{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;
