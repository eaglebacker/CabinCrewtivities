import { useState, useEffect } from 'react';
import { api } from '../api/client';
import ActivityCard from './ActivityCard';
import ActivityModal from './ActivityModal';

export default function ActivityList() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActivity, setNewActivity] = useState({ name: '', description: '' });
  const [adding, setAdding] = useState(false);

  const loadActivities = async () => {
    try {
      const data = await api.getActivities();
      setActivities(data);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newActivity.name.trim()) return;

    setAdding(true);
    try {
      await api.createActivity(newActivity);
      setNewActivity({ name: '', description: '' });
      setShowAddForm(false);
      loadActivities();
    } catch (err) {
      console.error('Failed to create activity:', err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="rounded-lg shadow-md p-4 border-2" style={{ backgroundColor: '#FDF8F0', borderColor: '#DEB887' }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg" style={{ color: '#6B3410' }}>Activities</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm text-white px-3 py-1 rounded transition-colors"
          style={{ backgroundColor: '#2D5A27' }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#4A7C43'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#2D5A27'}
        >
          + Add
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#F5DEB3' }}>
          <input
            type="text"
            value={newActivity.name}
            onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
            placeholder="Activity name"
            className="w-full px-3 py-2 rounded mb-2"
            style={{ border: '2px solid #DEB887', backgroundColor: '#FFFAF5' }}
            required
          />
          <textarea
            value={newActivity.description}
            onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 rounded mb-2 text-sm"
            style={{ border: '2px solid #DEB887', backgroundColor: '#FFFAF5' }}
            rows={2}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={adding}
              className="text-white px-3 py-1 rounded text-sm disabled:opacity-50 transition-colors"
              style={{ backgroundColor: '#2D5A27' }}
              onMouseOver={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#4A7C43')}
              onMouseOut={(e) => e.target.style.backgroundColor = '#2D5A27'}
            >
              {adding ? 'Adding...' : 'Add Activity'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 text-sm"
              style={{ color: '#8B4513' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8" style={{ color: '#8B4513' }}>Loading...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8" style={{ color: '#8B4513' }}>
          No activities yet. Add one to get started!
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onShowDetails={setSelectedId}
              onUpdate={loadActivities}
            />
          ))}
        </div>
      )}

      {selectedId && (
        <ActivityModal
          activityId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdate={loadActivities}
        />
      )}
    </div>
  );
}
