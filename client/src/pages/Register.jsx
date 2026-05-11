import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

export default function Register() {
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('code') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingCode, setValidatingCode] = useState(true);
  const [codeValid, setCodeValid] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!inviteCode) {
      setValidatingCode(false);
      setError('No invite code provided. Please use a valid invite link.');
      return;
    }

    api.validateInvite(inviteCode)
      .then(({ valid }) => {
        setCodeValid(valid);
        if (!valid) {
          setError('Invalid or expired invite code.');
        }
      })
      .catch(() => setError('Failed to validate invite code.'))
      .finally(() => setValidatingCode(false));
  }, [inviteCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(email, password, displayName, inviteCode);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (validatingCode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ color: '#8B4513' }}>Validating invite code...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <CabinIcon className="w-16 h-16 mx-auto mb-3" style={{ color: '#8B4513' }} />
          <h1 className="text-3xl font-bold" style={{ color: '#8B4513' }}>Cabin Crewtivities</h1>
          <p className="text-amber-800 mt-1">You've been invited to join the crew!</p>
        </div>

        <div className="rounded-lg shadow-lg p-6 border-2" style={{ backgroundColor: '#FDF8F0', borderColor: '#DEB887' }}>
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#6B3410' }}>Join the Cabin</h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 border border-red-200">
              {error}
            </div>
          )}

          {!codeValid ? (
            <p style={{ color: '#6B3410' }}>
              You need a valid invite link to join the cabin crew.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: '#6B3410' }}>Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:outline-none"
                  style={{ borderColor: '#DEB887', backgroundColor: '#FFFAF5' }}
                  placeholder="How your crew will see you"
                  required
                />
              </div>

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
                  minLength={6}
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
                {loading ? 'Joining...' : 'Join the Crew'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
