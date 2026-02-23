import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';

function AdminDashboard() {
  const location = useLocation();

  if (location.pathname === '/admin') {
    return <Navigate to="/admin/versions" replace />;
  }

  return (
    <div className="admin-dashboard">
      <nav className="admin-nav">
        <h1>MDM Admin Dashboard</h1>
        <div className="nav-links">
          <Link to="/admin/versions" className={location.pathname === '/admin/versions' ? 'active' : ''}>
            Version Management
          </Link>
          <Link to="/" className="client-link">: Back to Client View</Link>
        </div>
      </nav>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminDashboard;
