export default function VoteStars({ rating, avgRating, onRate, size = 'md' }) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRate(star)}
            className={`
              ${sizeClasses[size]} transition-colors
              ${star <= (rating || 0)
                ? 'text-yellow-400'
                : 'text-gray-300 hover:text-yellow-200'
              }
            `}
          >
            ★
          </button>
        ))}
      </div>
      {avgRating !== undefined && (
        <div className="text-xs text-gray-500">
          Avg: {avgRating.toFixed(1)} / 5
        </div>
      )}
    </div>
  );
}
