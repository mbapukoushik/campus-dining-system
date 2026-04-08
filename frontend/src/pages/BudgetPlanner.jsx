import React, { useState } from 'react';
import { IndianRupee, Users, Utensils, Sparkles, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { calculateBudget } from '../services/api';

const BudgetPlanner = () => {
  const [formData, setFormData] = useState({
    budget: '',
    headcount: '1',
    category: '',
    dietary_preference: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await calculateBudget({
        ...formData,
        budget: parseInt(formData.budget),
        headcount: parseInt(formData.headcount)
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to calculate recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Smart Budget Planner</h1>
        <p>Algorithm-driven meal recommendations for campus events & groups</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem', alignItems: 'start' }}>

        {/* ── Form Panel ── */}
        <form onSubmit={handleSubmit} className="card flex-col">
          <h3 className="section-label">Planner Settings</h3>

          <div>
            <label>Total Budget (₹)</label>
            <div style={{ position: 'relative' }}>
              <IndianRupee size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="number"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="e.g. 500"
                value={formData.budget}
                onChange={e => setFormData({...formData, budget: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <label>Headcount</label>
            <div style={{ position: 'relative' }}>
              <Users size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="number"
                style={{ paddingLeft: '2.5rem' }}
                value={formData.headcount}
                onChange={e => setFormData({...formData, headcount: e.target.value})}
                min="1"
                required
              />
            </div>
          </div>

          <div>
            <label>Category (optional)</label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option value="">All Categories</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snacks">Snacks</option>
              <option value="beverages">Beverages</option>
              <option value="desserts">Desserts</option>
              <option value="combos">Combos</option>
            </select>
          </div>

          <div>
            <label>Dietary Preference (optional)</label>
            <select value={formData.dietary_preference} onChange={e => setFormData({...formData, dietary_preference: e.target.value})}>
              <option value="">No Preference</option>
              <option value="veg">Vegetarian</option>
              <option value="non-veg">Non-Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="jain">Jain</option>
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? <div className="spinner"></div> : <><Sparkles size={18} /> Generate Plan</>}
          </button>

          {error && <div className="alert alert-error"><AlertCircle size={18} />{error}</div>}
        </form>

        {/* ── Results Panel ── */}
        <div>
          {result ? (
            <div className="flex-col">

              {/* Summary Alert */}
              <div className={`alert ${result.recommendation === 'Highly Recommended' ? 'alert-success' : 'alert-info'}`}>
                {result.recommendation === 'Highly Recommended' ? <CheckCircle2 size={22} /> : <TrendingUp size={22} />}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{result.recommendation}</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    ₹{result.meta.per_person_budget} per person &nbsp;|&nbsp;
                    Median price for category: ₹{result.meta.median_price} &nbsp;|&nbsp;
                    {result.meta.items_within_budget} of {result.meta.items_in_category} items fit your budget
                  </div>
                </div>
              </div>

              {/* Max Spend Warning */}
              {result.max_spend_warning && (
                <div className="alert alert-warning">
                  <AlertCircle size={18} />
                  <div>
                    <strong>Low Budget Warning</strong>
                    <p style={{ fontSize: '0.85rem' }}>The cheapest items in this category exceed your per-person budget of ₹{result.meta.per_person_budget}.</p>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <h3 className="section-label">Best Matching Options</h3>
              {result.recommendations.length > 0 ? (
                result.recommendations.map((rec, idx) => (
                  <div key={idx} className="card flex-col" style={{ borderLeft: idx === 0 ? '4px solid var(--accent)' : '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{rec.item_name}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                          {rec.stall_name} &nbsp;·&nbsp; {rec.location_tag}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                          <span className="tag">{rec.category}</span>
                          {rec.dietary_tag && <span className={`badge ${rec.dietary_tag === 'veg' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.65rem' }}>{rec.dietary_tag}</span>}
                          <span className={`badge ${rec.is_currently_open ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.65rem' }}>{rec.is_currently_open ? 'Open' : 'Closed'}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)' }}>₹{rec.price}</div>
                        <div className="tag" style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>₹{rec.budget_remaining} left p.p.</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state card">
                  <Utensils className="empty-state-icon" />
                  <p>No affordable options found for this budget. Try increasing your budget or changing the category.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Utensils className="empty-state-icon" />
              <h3 style={{ marginBottom: '0.5rem' }}>Ready to plan?</h3>
              <p>Enter your budget and headcount to get smart, algorithm-driven dining recommendations across all SRM AP campus vendors.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetPlanner;
