import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

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
        <div className="text-gray-600">Validating invite code...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8">Cabin Crewtivities</h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Create Account</h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
              {error}
            </div>
          )}

          {!codeValid ? (
            <p className="text-gray-600">
              You need a valid invite link to create an account.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="How your friends will see you"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
