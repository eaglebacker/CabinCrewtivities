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
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Invite Links</h2>
        <button
          onClick={createInvite}
          disabled={creating}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? 'Creating...' : '+ Create Invite'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : invites.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No invites yet. Create one to invite friends!
        </div>
      ) : (
        <div className="space-y-3">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className={`
                p-3 rounded-lg border
                ${invite.isUsed
                  ? 'bg-green-50 border-green-200'
                  : invite.isExpired
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-white border-gray-200'
                }
              `}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded break-all">
                    {invite.code}
                  </code>

                  {invite.isUsed ? (
                    <p className="text-sm text-green-600 mt-2">
                      Used by {invite.usedBy.displayName}
                    </p>
                  ) : invite.isExpired ? (
                    <p className="text-sm text-gray-500 mt-2">Expired</p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">
                      Expires {formatDate(invite.expiresAt)}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-2">
                  {!invite.isUsed && !invite.isExpired && (
                    <button
                      onClick={() => copyLink(invite.code)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {copiedId === invite.code ? 'Copied!' : 'Copy Link'}
                    </button>
                  )}
                  <button
                    onClick={() => deleteInvite(invite.id)}
                    className="text-sm text-red-600 hover:underline"
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
