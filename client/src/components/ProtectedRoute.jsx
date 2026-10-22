
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
  const token = sessionStorage.getItem('skillsphereToken');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
