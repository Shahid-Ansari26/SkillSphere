
import { Navigate, Outlet } from 'react-router-dom';

function AdminRoute() {
  const token = sessionStorage.getItem('skillsphereToken');
  const savedUser = sessionStorage.getItem('skillsphereUser');

  let user = null;

  try {
    user = savedUser ? JSON.parse(savedUser) : null;
  } catch {
    user = null;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
