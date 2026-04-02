import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Info } from 'lucide-react';
import { fetchMenu, reportWaitTime } from '../services/api';

const VendorProfile = () => {
  const { id } = useParams();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waitMinutes, setWaitMinutes] = useState(10);
  const [reportStatus, setReportStatus] = useState('');

  useEffect(() => {
    fetchMenu(id)
      .then((res) => setMenu(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReportWait = async (e) => {
    e.preventDefault();
    try {
      await reportWaitTime(id, waitMinutes);
      setReportStatus('Report submitted!');
      setTimeout(() => setReportStatus(''), 3000);
    } catch (error) {
      setReportStatus('Failed to submit (Rate limit or error)');
    }
  };

  if (loading) return <div className="page-container">Loading Menu...</div>;

  return (
    <div className="page-container">
      <Link to="/" className="flex-row" style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
        <ArrowLeft size={20} /> Back to Dashboard
      </Link>
      
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Left Col: Menu */}
        <div style={{ flex: '1 1 600px' }}>
          <h1>Menu Items</h1>
          {menu.length === 0 && <p>No menu items available.</p>}
          <div className="flex-col">
            {menu.map((item) => (
              <div key={item._id} className="card flex-row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{item.name}</h3>
                  <div className="flex-row">
                    <span className="badge badge-warning">₹{item.price}</span>
                    <span className="badge" style={{ background: 'var(--bg-input)' }}>{item.category}</span>
                    {item.dietary_tags?.map((d) => (
                      <span key={d} className="badge badge-success" style={{ fontSize: '0.75rem' }}>{d}</span>
                    ))}
                  </div>
                </div>
                {item.is_sold_out && <span className="badge badge-danger">Sold Out</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Actions */}
        <div style={{ flex: '1 1 300px' }}>
          <div className="card">
            <h2 className="flex-row" style={{ marginTop: 0 }}><Clock size={24} /> Report Wait Time</h2>
            <form onSubmit={handleReportWait} className="flex-col">
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Estimated Wait (minutes)
              </label>
              <input 
                type="number" 
                min="0" max="120"
                value={waitMinutes}
                onChange={(e) => setWaitMinutes(Number(e.target.value))}
                required 
              />
              <button type="submit" style={{ width: '100%' }}>Submit Report</button>
            </form>
            {reportStatus && (
              <div className="flex-row" style={{ marginTop: '1rem', color: 'var(--accent-primary)' }}>
                <Info size={16} /> {reportStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;
