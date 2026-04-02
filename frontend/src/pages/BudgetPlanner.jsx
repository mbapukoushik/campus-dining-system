import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, AlertTriangle, ChevronRight } from 'lucide-react';
import { calculateBudget } from '../services/api';

const BudgetPlanner = () => {
  const [budget, setBudget] = useState(200);
  const [headcount, setHeadcount] = useState(1);
  const [category, setCategory] = useState('All');
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const perPersonBudget = budget > 0 && headcount > 0 ? Math.floor(Number(budget) / Number(headcount)) : 0;

  const submitPlanner = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      // Fix: backend expects 'budget' (not 'total_budget') and 'headcount'
      const payload = {
        budget: Number(budget),
        headcount: Number(headcount),
        category: category !== 'All' ? category : undefined,
      };
      const res = await calculateBudget(payload);
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to calculate budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <h1 className="flex-row"><Calculator size={32} /> Smart Budget Planner</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Find the most affordable options across campus dining.</p>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={submitPlanner} className="flex-col">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label>Total Budget (₹)</label>
              <input type="number" min="10" value={budget} onChange={e => setBudget(e.target.value)} required />
            </div>
            <div>
              <label>Headcount</label>
              <input type="number" min="1" max="20" value={headcount} onChange={e => setHeadcount(e.target.value)} required />
            </div>
          </div>

          {/* Live per-person preview */}
          {perPersonBudget > 0 && (
            <p style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '0.9rem' }}>
              → ₹{perPersonBudget} per person
            </p>
          )}

          <div>
            <label>Category Filter (Optional)</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="All">Any Category</option>
              <option value="Meals">Meals</option>
              <option value="Snacks">Snacks</option>
              <option value="Beverages">Beverages</option>
            </select>
          </div>
          <button type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Crunching Numbers...' : 'Find Recommendations'}
          </button>
        </form>
        {error && <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>{error}</p>}
      </div>

      {results && (
        <div className="flex-col">
          {/* Warning Banner — shown when cheapest item > per-person budget */}
          {results.max_spend_warning && (
            <div className="card flex-row" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'var(--warning)', color: 'var(--warning)', border: '1px solid' }}>
              <AlertTriangle size={24} style={{ flexShrink: 0 }} />
              <div>
                <strong>Budget Warning!</strong>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  The cheapest available item exceeds your per-person budget of ₹{results.meta?.per_person_budget}.
                  Showing closest matches anyway.
                </p>
              </div>
            </div>
          )}

          <h2>
            Top Recommendations
            {results.meta && (
              <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '1rem' }}>
                ₹{results.meta.budget_submitted} total · {results.meta.headcount} people · ₹{results.meta.per_person_budget}/person
              </span>
            )}
          </h2>

          {(!results.recommendations || results.recommendations.length === 0) && (
            <p style={{ color: 'var(--text-secondary)' }}>
              {results.message || 'No affordable options found for your budget.'}
            </p>
          )}
          
          <div className="flex-col">
            {results.recommendations?.map((rec, i) => (
              <Link to={`/vendors/${rec.vendor_id}`} key={i} className="card flex-row" style={{ justifyContent: 'space-between', textDecoration: 'none' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0' }}>{rec.stall_name}</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    Best pick: <strong>{rec.item_name}</strong> · {rec.category}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {rec.location_tag} · {rec.is_currently_open ? '🟢 Open' : '🔴 Closed'}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="badge badge-success" style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>₹{rec.price}/person</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>₹{rec.budget_remaining} remaining</div>
                </div>
                <ChevronRight size={24} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetPlanner;
