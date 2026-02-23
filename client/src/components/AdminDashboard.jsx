import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';

function AdminDashboard() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (location.pathname === '/admin') return <Navigate to="/admin/versions" replace />;

  return (
    <div className="admin-dashboard">
      <nav className="admin-nav">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>MDM Admin Dashboard</h1>
          <div>
            <p style={{ margin: 0, fontSize: '14px' }}>Welcome, {user.username}</p>
            <button onClick={handleLogout} style={{ padding: '6px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>
        <div className="nav-links">
          {[['versions', 'Version Management'], ['push-update', 'Push Updates'], ['active-updates', 'Active Updates'], ['analytics', 'Analytics']].map(([path, label]) => (
            <><Link key={path} to={`/admin/${path}`} className={location.pathname === `/admin/${path}` ? 'active' : ''}>{label}</Link>,<br /></>
          ))}
          <Link to="/" className="client-link">Back to Client View</Link>
        </div>
      </nav>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminDashboard;
