import React, { useState } from 'react';
import { IndianRupee, Users, Utensils, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
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
        <h1>Smart Event Budget Planner</h1>
        <p>Algorithm-driven meal planning for campus events and groups</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2.5rem' }}>
        <div>
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
              <label>Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="">All Categories</option>
                <option value="Main Course">Main Course</option>
                <option value="Fast Food">Fast Food</option>
                <option value="Supper">Supper</option>
                <option value="Snacks">Snacks</option>
                <option value="Beverages">Beverages</option>
              </select>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? <div className="spinner"></div> : <><Sparkles size={18} /> Generate Plan</>}
            </button>

            {error && <div className="alert alert-error">{error}</div>}
          </form>
        </div>

        <div>
          {result ? (
            <div className="flex-col">
              <div className={`alert ${result.recommendation === 'Highly Recommended' ? 'alert-success' : 'alert-info'}`}>
                {result.recommendation === 'Highly Recommended' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{result.recommendation}</div>
                  <div style={{ fontSize: '0.85rem' }}>
                    Per person budget: ₹{result.per_person_budget} | 
                    Median price for category: ₹{result.meta.median_price}
                  </div>
                </div>
              </div>

              {result.max_spend_warning && (
                <div className="alert alert-warning">
                  <AlertCircle size={20} />
                  <div>
                    <strong>Warning: High Spend Required</strong>
                    <p style={{ fontSize: '0.85rem' }}>The cheapest items in this category exceed your per-person budget.</p>
                  </div>
                </div>
              )}

              <h3 className="section-label">Top Recommendation</h3>
              {result.recommendations.length > 0 ? (
                result.recommendations.map((rec, idx) => (
                  <div key={idx} className="card card-hover flex-col" style={{ borderLeft: idx === 0 ? '4px solid var(--accent)' : '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem' }}>{rec.item_name}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>from <strong>{rec.stall_name}</strong> • {rec.location_tag}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--accent)' }}>₹{rec.price}</div>
                        <div className="tag" style={{ marginTop: '0.25rem' }}>₹{rec.budget_remaining} left p.p.</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state card">
                  <Utensils className="empty-state-icon" />
                  <p>No affordable options found for this budget.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Utensils className="empty-state-icon" />
              <p>Enter your budget settings to see algorithm-backed dining recommendations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetPlanner;
