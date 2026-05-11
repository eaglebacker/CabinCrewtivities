import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

function CabinIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 2.5L18 11v8h-2v-6H8v6H6v-8l6-5.5z"/>
      <path d="M12 2L2 11h2.5L12 4.5 19.5 11H22L12 2z"/>
      <rect x="10" y="12" width="4" height="4" rx="0.5"/>
    </svg>
  );
}

function BellIcon({ className, enabled }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
      {!enabled && (
        <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2"/>
      )}
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then(settings => setEmailNotifications(settings.emailNotifications))
      .catch(() => {});
  }, []);

  const toggleNotifications = async () => {
    setLoading(true);
    try {
      const newValue = !emailNotifications;
      await api.updateSettings({ emailNotifications: newValue });
      setEmailNotifications(newValue);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setLoading(false);
    }
  };

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
            {/* EMAIL NOTIFICATIONS - Uncomment when domain is verified in Resend
            <button
              onClick={toggleNotifications}
              disabled={loading}
              className="p-1 rounded transition-colors hover:bg-amber-900 disabled:opacity-50"
              title={emailNotifications ? 'Email notifications ON - click to disable' : 'Email notifications OFF - click to enable'}
            >
              <BellIcon
                className="w-5 h-5"
                enabled={emailNotifications}
                style={{ color: emailNotifications ? '#FDE68A' : '#A16207' }}
              />
            </button>
            */}
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
