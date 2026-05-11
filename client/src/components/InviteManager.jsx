import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function InviteManager() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const loadInvites = async () => {
    try {
      const data = await api.getInvites();
      setInvites(data);
    } catch (err) {
      console.error('Failed to load invites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const createInvite = async () => {
    setCreating(true);
    try {
      await api.createInvite();
      loadInvites();
    } catch (err) {
      console.error('Failed to create invite:', err);
    } finally {
      setCreating(false);
    }
  };

  const deleteInvite = async (id) => {
    if (!confirm('Delete this invite?')) return;
    try {
      await api.deleteInvite(id);
      loadInvites();
    } catch (err) {
      console.error('Failed to delete invite:', err);
    }
  };

  const copyLink = (code) => {
    const url = `${window.location.origin}/register?code=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="rounded-lg shadow-md p-4 border-2" style={{ backgroundColor: '#FDF8F0', borderColor: '#DEB887' }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg" style={{ color: '#6B3410' }}>Invite Links</h2>
        <button
          onClick={createInvite}
          disabled={creating}
          className="text-sm text-white px-3 py-1 rounded disabled:opacity-50 transition-colors"
          style={{ backgroundColor: '#2D5A27' }}
          onMouseOver={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#4A7C43')}
          onMouseOut={(e) => e.target.style.backgroundColor = '#2D5A27'}
        >
          {creating ? 'Creating...' : '+ Create Invite'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8" style={{ color: '#8B4513' }}>Loading...</div>
      ) : invites.length === 0 ? (
        <div className="text-center py-8" style={{ color: '#8B4513' }}>
          No invites yet. Create one to invite friends!
        </div>
      ) : (
        <div className="space-y-3">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="p-3 rounded-lg"
              style={invite.isUsed
                ? { backgroundColor: '#E8F5E9', border: '1px solid #4A7C43' }
                : invite.isExpired
                  ? { backgroundColor: '#F5DEB3', border: '1px solid #DEB887' }
                  : { backgroundColor: '#FFFAF5', border: '1px solid #DEB887' }
              }
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <code className="text-sm px-2 py-1 rounded break-all" style={{ backgroundColor: '#F5DEB3', color: '#6B3410' }}>
                    {invite.code}
                  </code>

                  {invite.isUsed ? (
                    <p className="text-sm mt-2" style={{ color: '#2D5A27' }}>
                      Used by {invite.usedBy.displayName}
                    </p>
                  ) : invite.isExpired ? (
                    <p className="text-sm mt-2" style={{ color: '#A0522D' }}>Expired</p>
                  ) : (
                    <p className="text-sm mt-2" style={{ color: '#8B4513' }}>
                      Expires {formatDate(invite.expiresAt)}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-2">
                  {!invite.isUsed && !invite.isExpired && (
                    <button
                      onClick={() => copyLink(invite.code)}
                      className="text-sm hover:underline"
                      style={{ color: '#2D5A27' }}
                    >
                      {copiedId === invite.code ? 'Copied!' : 'Copy Link'}
                    </button>
                  )}
                  <button
                    onClick={() => deleteInvite(invite.id)}
                    className="text-sm hover:underline"
                    style={{ color: '#A0522D' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
