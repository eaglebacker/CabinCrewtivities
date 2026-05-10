import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          <Link to="/" className="font-bold text-lg text-blue-600">
            Cabin Crewtivities
          </Link>

          <div className="flex items-center gap-4">
            {user?.isAdmin && (
              <Link
                to="/admin"
                className="text-gray-600 hover:text-gray-900"
              >
                Admin
              </Link>
            )}
            <span className="text-sm text-gray-500">{user?.displayName}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
