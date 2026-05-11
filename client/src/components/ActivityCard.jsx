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
    <div className="rounded-lg shadow-sm p-4" style={{ backgroundColor: '#FFFAF5', border: '1px solid #DEB887' }}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onShowDetails(activity.id)}
            className="font-medium text-left truncate block w-full hover:underline"
            style={{ color: '#6B3410' }}
          >
            {activity.name}
          </button>
          {activity.eventDate && (
            <p className="text-sm mt-1" style={{ color: '#8B4513' }}>
              {new Date(activity.eventDate).toLocaleDateString()}
              {activity.eventTime && ` at ${activity.eventTime}`}
            </p>
          )}
          <p className="text-xs mt-1" style={{ color: '#A0522D' }}>
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
