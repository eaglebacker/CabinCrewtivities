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
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Activities</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          + Add
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="mb-4 p-3 bg-gray-50 rounded-lg">
          <input
            type="text"
            value={newActivity.name}
            onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
            placeholder="Activity name"
            className="w-full px-3 py-2 border rounded mb-2"
            required
          />
          <textarea
            value={newActivity.description}
            onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 border rounded mb-2 text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={adding}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Add Activity'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-600 px-3 py-1 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
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
