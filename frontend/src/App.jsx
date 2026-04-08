import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Utensils, LayoutDashboard, Calculator, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import StudentDashboard from './pages/StudentDashboard';
import VendorProfile from './pages/VendorProfile';
import BudgetPlanner from './pages/BudgetPlanner';
import LoginPage from './pages/LoginPage';

// ─── Navigation Bar ────────────────────────────────────────────────────────
const NavBar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null; // Don't show navbar on login page

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <span className="nav-dot"></span>
        Campus Dining HQ
      </Link>

      <div className="nav-links">
        <Link
          to="/"
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          <LayoutDashboard size={16} /> Dashboard
        </Link>
        <Link
          to="/planner"
          className={`nav-link ${location.pathname === '/planner' ? 'active' : ''}`}
        >
          <Calculator size={16} /> Budget Planner
        </Link>
      </div>

      <div className="nav-right">
        <div className="nav-avatar">
          {user.email?.charAt(0).toUpperCase()}
        </div>
        <span className="nav-user-email">{user.email}</span>
        <button
          className="btn-ghost btn-sm"
          onClick={logout}
          title="Sign out"
          style={{ padding: '6px 10px' }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </nav>
  );
};

// ─── Protected Route ────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p>Verifying session...</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

// ─── App Routing ────────────────────────────────────────────────────────────
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p>Loading Campus Dining HQ...</p>
      </div>
    );
  }

  return (
    <>
      <NavBar />
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/"
          element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>}
        />
        <Route
          path="/vendors/:id"
          element={<ProtectedRoute><VendorProfile /></ProtectedRoute>}
        />
        <Route
          path="/planner"
          element={<ProtectedRoute><BudgetPlanner /></ProtectedRoute>}
        />
        {/* Catch-all: redirect unknown paths to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

// ─── Root App (wrapped with AuthProvider + BrowserRouter) ───────────────────
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
