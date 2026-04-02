import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Utensils, LayoutDashboard, Calculator } from 'lucide-react';
import StudentDashboard from './pages/StudentDashboard';
import VendorProfile from './pages/VendorProfile';
import BudgetPlanner from './pages/BudgetPlanner';

const NavBar = () => {
  const location = useLocation();
  return (
    <nav className="navbar">
      <Link to="/" className="flex-row">
        <Utensils color="var(--accent-primary)" size={28} />
        <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Campus Dining HQ</span>
      </Link>
      <div className="nav-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <LayoutDashboard size={18} /> Dashboard
        </Link>
        <Link to="/planner" className={`nav-link ${location.pathname === '/planner' ? 'active' : ''}`}>
          <Calculator size={18} /> Budget Planner
        </Link>
      </div>
    </nav>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<StudentDashboard />} />
        <Route path="/vendors/:id" element={<VendorProfile />} />
        <Route path="/planner" element={<BudgetPlanner />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
