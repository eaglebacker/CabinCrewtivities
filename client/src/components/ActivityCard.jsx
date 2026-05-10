import { useState, useEffect } from 'react';
import { api } from '../api/client';
import VoteStars from './VoteStars';

export default function ActivityCard({ activity, onShowDetails, onUpdate }) {
  const [myRating, setMyRating] = useState(null);
  const [avgRating, setAvgRating] = useState(activity.avgRating);
  const [voteCount, setVoteCount] = useState(activity.voteCount);

  useEffect(() => {
    api.getMyVote(activity.id)
      .then(({ rating }) => setMyRating(rating))
      .catch(() => {});
  }, [activity.id]);

  const handleRate = async (rating) => {
    try {
      const result = await api.vote(activity.id, rating);
      setMyRating(rating);
      setAvgRating(result.avgRating);
      setVoteCount(result.voteCount);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onShowDetails(activity.id)}
            className="font-medium text-left hover:text-blue-600 truncate block w-full"
          >
            {activity.name}
          </button>
          {activity.eventDate && (
            <p className="text-sm text-gray-500 mt-1">
              {new Date(activity.eventDate).toLocaleDateString()}
              {activity.eventTime && ` at ${activity.eventTime}`}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {voteCount} vote{voteCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex-shrink-0">
          <VoteStars
            rating={myRating}
            avgRating={avgRating}
            onRate={handleRate}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
