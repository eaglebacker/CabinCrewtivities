import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import VoteStars from './VoteStars';

export default function ActivityModal({ activityId, onClose, onUpdate }) {
  const [activity, setActivity] = useState(null);
  const [myRating, setMyRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      api.getActivity(activityId),
      api.getMyVote(activityId)
    ])
      .then(([activityData, voteData]) => {
        setActivity(activityData);
        setMyRating(voteData.rating);
        setEditForm({
          name: activityData.name,
          description: activityData.description || '',
          location: activityData.location || '',
          eventDate: activityData.eventDate || '',
          eventTime: activityData.eventTime || '',
          links: (activityData.links || []).join('\n')
        });
      })
      .finally(() => setLoading(false));
  }, [activityId]);

  const handleRate = async (rating) => {
    try {
      const result = await api.vote(activityId, rating);
      setMyRating(rating);
      setActivity({
        ...activity,
        avgRating: result.avgRating,
        voteCount: result.voteCount
      });
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const links = editForm.links
        .split('\n')
        .map(l => l.trim())
        .filter(l => l);

      await api.updateActivity(activityId, {
        ...editForm,
        links: links.length > 0 ? links : null
      });

      const updated = await api.getActivity(activityId);
      setActivity(updated);
      setEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to update:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this activity?')) return;
    try {
      await api.deleteActivity(activityId);
      onClose();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const canEdit = activity && (
    user?.isAdmin || activity.createdBy?.id === user?.id
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="rounded-lg p-6 border-2" style={{ backgroundColor: '#FDF8F0', borderColor: '#DEB887', color: '#8B4513' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto border-2" style={{ backgroundColor: '#FDF8F0', borderColor: '#DEB887' }}>
        <div className="p-4 flex justify-between items-center" style={{ borderBottom: '2px solid #DEB887' }}>
          <h2 className="font-semibold text-lg" style={{ color: '#6B3410' }}>Activity Details</h2>
          <button onClick={onClose} className="text-xl" style={{ color: '#8B4513' }}>&times;</button>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#6B3410' }}>Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded"
                style={{ border: '2px solid #DEB887', backgroundColor: '#FFFAF5' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#6B3410' }}>Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded"
                style={{ border: '2px solid #DEB887', backgroundColor: '#FFFAF5' }}
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#6B3410' }}>Location</label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                className="w-full px-3 py-2 rounded"
                style={{ border: '2px solid #DEB887', backgroundColor: '#FFFAF5' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6B3410' }}>Date</label>
                <input
                  type="date"
                  value={editForm.eventDate}
                  onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })}
                  className="w-full px-3 py-2 rounded"
                  style={{ border: '2px solid #DEB887', backgroundColor: '#FFFAF5' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6B3410' }}>Time</label>
                <input
                  type="text"
                  value={editForm.eventTime}
                  onChange={(e) => setEditForm({ ...editForm, eventTime: e.target.value })}
                  placeholder="e.g. 7pm"
                  className="w-full px-3 py-2 rounded"
                  style={{ border: '2px solid #DEB887', backgroundColor: '#FFFAF5' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#6B3410' }}>Links (one per line)</label>
              <textarea
                value={editForm.links}
                onChange={(e) => setEditForm({ ...editForm, links: e.target.value })}
                className="w-full px-3 py-2 rounded text-sm"
                style={{ border: '2px solid #DEB887', backgroundColor: '#FFFAF5' }}
                rows={2}
                placeholder="https://..."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#2D5A27' }}
                onMouseOver={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#4A7C43')}
                onMouseOut={(e) => e.target.style.backgroundColor = '#2D5A27'}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2"
                style={{ color: '#8B4513' }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#6B3410' }}>{activity.name}</h3>

            <div className="mb-4">
              <p className="text-sm mb-2" style={{ color: '#8B4513' }}>Your rating:</p>
              <VoteStars
                rating={myRating}
                avgRating={activity.avgRating}
                onRate={handleRate}
              />
              <p className="text-sm mt-1" style={{ color: '#8B4513' }}>
                {activity.voteCount} vote{activity.voteCount !== 1 ? 's' : ''}
              </p>
            </div>

            {activity.description && (
              <div className="mb-4">
                <p className="text-sm font-medium" style={{ color: '#8B4513' }}>Description</p>
                <p style={{ color: '#6B3410' }}>{activity.description}</p>
              </div>
            )}

            {activity.location && (
              <div className="mb-4">
                <p className="text-sm font-medium" style={{ color: '#8B4513' }}>Location</p>
                <p style={{ color: '#6B3410' }}>{activity.location}</p>
              </div>
            )}

            {activity.eventDate && (
              <div className="mb-4">
                <p className="text-sm font-medium" style={{ color: '#8B4513' }}>Date & Time</p>
                <p style={{ color: '#6B3410' }}>
                  {new Date(activity.eventDate).toLocaleDateString()}
                  {activity.eventTime && ` at ${activity.eventTime}`}
                </p>
              </div>
            )}

            {activity.links?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium" style={{ color: '#8B4513' }}>Links</p>
                <ul>
                  {activity.links.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-sm break-all"
                        style={{ color: '#2D5A27' }}
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activity.availableUsers?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium" style={{ color: '#8B4513' }}>Available on this date</p>
                <ul className="text-sm" style={{ color: '#6B3410' }}>
                  {activity.availableUsers.map((u) => (
                    <li key={u.id}>{u.displayName}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs mb-4" style={{ color: '#A0522D' }}>
              Added by {activity.createdBy?.displayName}
            </p>

            {canEdit && (
              <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid #DEB887' }}>
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm hover:underline"
                  style={{ color: '#2D5A27' }}
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-sm hover:underline"
                  style={{ color: '#A0522D' }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
