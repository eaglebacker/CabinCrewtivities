import { useState } from 'react';
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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <CabinIcon className="w-16 h-16 mx-auto mb-3" style={{ color: '#8B4513' }} />
          <h1 className="text-3xl font-bold" style={{ color: '#8B4513' }}>Cabin Crewtivities</h1>
          <p className="text-amber-800 mt-1">Plan adventures with your crew</p>
        </div>

        <div className="rounded-lg shadow-lg p-6 border-2" style={{ backgroundColor: '#FDF8F0', borderColor: '#DEB887' }}>
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#6B3410' }}>Welcome Back</h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: '#6B3410' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:outline-none"
                style={{ borderColor: '#DEB887', backgroundColor: '#FFFAF5' }}
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1" style={{ color: '#6B3410' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:outline-none"
                style={{ borderColor: '#DEB887', backgroundColor: '#FFFAF5' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#2D5A27' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#4A7C43'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#2D5A27'}
            >
              {loading ? 'Logging in...' : 'Enter the Cabin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
