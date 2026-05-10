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
        <div className="bg-white rounded-lg p-6">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-lg">Activity Details</h2>
          <button onClick={onClose} className="text-gray-500 text-xl">&times;</button>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={editForm.eventDate}
                  onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <input
                  type="text"
                  value={editForm.eventTime}
                  onChange={(e) => setEditForm({ ...editForm, eventTime: e.target.value })}
                  placeholder="e.g. 7pm"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Links (one per line)</label>
              <textarea
                value={editForm.links}
                onChange={(e) => setEditForm({ ...editForm, links: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
                rows={2}
                placeholder="https://..."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-gray-600 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-2">{activity.name}</h3>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Your rating:</p>
              <VoteStars
                rating={myRating}
                avgRating={activity.avgRating}
                onRate={handleRate}
              />
              <p className="text-sm text-gray-500 mt-1">
                {activity.voteCount} vote{activity.voteCount !== 1 ? 's' : ''}
              </p>
            </div>

            {activity.description && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600">Description</p>
                <p className="text-gray-800">{activity.description}</p>
              </div>
            )}

            {activity.location && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600">Location</p>
                <p className="text-gray-800">{activity.location}</p>
              </div>
            )}

            {activity.eventDate && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600">Date & Time</p>
                <p className="text-gray-800">
                  {new Date(activity.eventDate).toLocaleDateString()}
                  {activity.eventTime && ` at ${activity.eventTime}`}
                </p>
              </div>
            )}

            {activity.links?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600">Links</p>
                <ul className="text-blue-600">
                  {activity.links.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-sm break-all"
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
                <p className="text-sm font-medium text-gray-600">Available on this date</p>
                <ul className="text-gray-800 text-sm">
                  {activity.availableUsers.map((u) => (
                    <li key={u.id}>{u.displayName}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-gray-400 mb-4">
              Added by {activity.createdBy?.displayName}
            </p>

            {canEdit && (
              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={() => setEditing(true)}
                  className="text-blue-600 text-sm hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-red-600 text-sm hover:underline"
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
