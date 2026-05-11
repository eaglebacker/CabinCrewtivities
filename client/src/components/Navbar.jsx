import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function CabinIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 2.5L18 11v8h-2v-6H8v6H6v-8l6-5.5z"/>
      <path d="M12 2L2 11h2.5L12 4.5 19.5 11H22L12 2z"/>
      <rect x="10" y="12" width="4" height="4" rx="0.5"/>
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="shadow-md" style={{ backgroundColor: '#8B4513' }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-amber-100 hover:text-white transition-colors">
            <CabinIcon className="w-6 h-6" />
            Cabin Crewtivities
          </Link>

          <div className="flex items-center gap-4">
            {user?.isAdmin && (
              <Link
                to="/admin"
                className="text-amber-200 hover:text-white transition-colors"
              >
                Admin
              </Link>
            )}
            <span className="text-sm text-amber-100">{user?.displayName}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-amber-200 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
