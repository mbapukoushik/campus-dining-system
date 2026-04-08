import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, Star, ChevronLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchVendorById, fetchVendorMenu, fetchVendorReviews, submitReview } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const StarRating = ({ value, onChange, name }) => (
  <div style={{ display: 'flex', gap: '0.35rem' }}>
    {[1, 2, 3, 4, 5].map(n => (
      <Star
        key={n}
        size={22}
        style={{ cursor: onChange ? 'pointer' : 'default', color: n <= value ? '#e8a000' : '#d1c4a0' }}
        fill={n <= value ? '#e8a000' : 'none'}
        onClick={() => onChange && onChange(n)}
      />
    ))}
  </div>
);

const VendorProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [vendor, setVendor]   = useState(null);
  const [menu, setMenu]       = useState([]);
  const [reviewData, setReviewData] = useState({ reviews: [], aggregate: null });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('menu');

  // Review form state
  const [reviewForm, setReviewForm] = useState({ taste_score: 0, value_score: 0, overall_score: 0, comment_text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg]   = useState(null); // { type: 'success'|'error', text }

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchVendorById(id),
      fetchVendorMenu(id),
      fetchVendorReviews(id),
    ]).then(([vRes, mRes, rRes]) => {
      setVendor(vRes.data);
      setMenu(mRes.data);
      setReviewData(rRes.data);
    }).catch(err => console.error('Failed to load vendor profile', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.taste_score || !reviewForm.value_score || !reviewForm.overall_score) {
      setSubmitMsg({ type: 'error', text: 'Please fill in all three star ratings.' });
      return;
    }
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      await submitReview(id, reviewForm);
      setSubmitMsg({ type: 'success', text: 'Review submitted successfully! Thank you.' });
      setReviewForm({ taste_score: 0, value_score: 0, overall_score: 0, comment_text: '' });
      // Reload reviews
      const rRes = await fetchVendorReviews(id);
      setReviewData(rRes.data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit review.';
      setSubmitMsg({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div><p>Loading vendor details...</p></div>;
  if (!vendor) return <div className="page-container"><p>Vendor not found.</p></div>;

  const agg = reviewData.aggregate;

  return (
    <div className="page-container">
      <Link to="/" className="btn-ghost btn-sm" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
        <ChevronLeft size={16} /> Back to Dashboard
      </Link>

      {/* ── Vendor Header Card ── */}
      <div className="card flex-col" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.35rem' }}>{vendor.stall_name}</h1>
            <div className="flex-row" style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
              <MapPin size={15} /><span>{vendor.location_tag}</span>
            </div>
          </div>
          <span className={`badge ${vendor.is_currently_open ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.9rem', padding: '0.4rem 0.9rem' }}>
            {vendor.is_currently_open ? '● Open Now' : '○ Closed'}
          </span>
        </div>

        <div className="divider" style={{ margin: '1rem 0' }}></div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
          <div className="stat-card">
            <div className="stat-num">{agg?.avg_overall ?? vendor.avg_rating ?? '—'}</div>
            <div className="stat-label">Overall Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{agg?.avg_taste ?? '—'}</div>
            <div className="stat-label">Taste Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{agg?.avg_value ?? '—'}</div>
            <div className="stat-label">Value Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{vendor.current_wait_time || 0} m</div>
            <div className="stat-label">Wait Time</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{menu.length}</div>
            <div className="stat-label">Menu Items</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{agg?.total_reviews ?? 0}</div>
            <div className="stat-label">Reviews</div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem' }}>
        {['menu', 'reviews', 'write-review'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none', border: 'none', padding: '0.6rem 1.2rem',
              fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-2px', cursor: 'pointer', fontSize: '0.95rem',
            }}
          >
            {tab === 'menu' ? 'Menu' : tab === 'reviews' ? `Reviews (${agg?.total_reviews ?? 0})` : 'Write a Review'}
          </button>
        ))}
      </div>

      {/* ── Menu Tab ── */}
      {activeTab === 'menu' && (
        menu.length === 0
          ? <p className="empty-state">No menu items listed.</p>
          : <div className="flex-col">
              {menu.map(item => (
                <div key={item._id} className="card flex-row" style={{ justifyContent: 'space-between' }}>
                  <div className="flex-col" style={{ gap: '0.3rem' }}>
                    <div className="flex-row">
                      <span style={{ fontWeight: 600 }}>{item.item_name}</span>
                      {item.dietary_tag && (
                        <span className={`badge ${item.dietary_tag === 'veg' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.65rem' }}>
                          {item.dietary_tag}
                        </span>
                      )}
                      {item.is_sold_out && <span className="badge badge-red" style={{ fontSize: '0.65rem' }}>Sold Out</span>}
                    </div>
                    <span className="tag">{item.category}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>₹{item.price}</div>
                </div>
              ))}
            </div>
      )}

      {/* ── Reviews Tab ── */}
      {activeTab === 'reviews' && (
        reviewData.reviews.length === 0
          ? <p className="empty-state">No reviews yet. Be the first to review!</p>
          : <div className="flex-col">
              {reviewData.reviews.map(r => (
                <div key={r._id} className="card flex-col" style={{ gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div><span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Taste</span><br /><StarRating value={r.taste_score} /></div>
                    <div><span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Value</span><br /><StarRating value={r.value_score} /></div>
                    <div><span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Overall</span><br /><StarRating value={r.overall_score} /></div>
                  </div>
                  {r.comment_text && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>"{r.comment_text}"</p>}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{new Date(r.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              ))}
            </div>
      )}

      {/* ── Write Review Tab ── */}
      {activeTab === 'write-review' && (
        <div className="card flex-col" style={{ maxWidth: '560px' }}>
          <h3 style={{ marginBottom: '1rem' }}>Share Your Experience</h3>
          <form onSubmit={handleReviewSubmit} className="flex-col" style={{ gap: '1.25rem' }}>
            <div>
              <label style={{ marginBottom: '0.4rem', display: 'block' }}>Taste Rating *</label>
              <StarRating value={reviewForm.taste_score} onChange={v => setReviewForm(f => ({ ...f, taste_score: v }))} />
            </div>
            <div>
              <label style={{ marginBottom: '0.4rem', display: 'block' }}>Value for Money *</label>
              <StarRating value={reviewForm.value_score} onChange={v => setReviewForm(f => ({ ...f, value_score: v }))} />
            </div>
            <div>
              <label style={{ marginBottom: '0.4rem', display: 'block' }}>Overall Rating *</label>
              <StarRating value={reviewForm.overall_score} onChange={v => setReviewForm(f => ({ ...f, overall_score: v }))} />
            </div>
            <div>
              <label style={{ marginBottom: '0.4rem', display: 'block' }}>Comment (optional)</label>
              <textarea
                rows={3}
                placeholder="Share what you loved or what could be improved..."
                value={reviewForm.comment_text}
                onChange={e => setReviewForm(f => ({ ...f, comment_text: e.target.value }))}
                maxLength={1000}
                style={{ resize: 'vertical' }}
              />
            </div>
            {submitMsg && (
              <div className={`alert ${submitMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                {submitMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {submitMsg.text}
              </div>
            )}
            <button type="submit" disabled={submitting}>
              {submitting ? <div className="spinner"></div> : <><Send size={16} /> Submit Review</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default VendorProfile;
