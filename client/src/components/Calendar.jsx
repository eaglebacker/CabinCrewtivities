import { useState, useEffect } from 'react';
import { api } from '../api/client';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState({});
  const [myDates, setMyDates] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getCalendar(monthStr),
      api.getMyAvailability(monthStr)
    ])
      .then(([allAvail, myAvail]) => {
        setAvailability(allAvail);
        setMyDates(myAvail);
      })
      .finally(() => setLoading(false));
  }, [monthStr]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const toggleAvailability = async (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isCurrentlyAvailable = myDates.includes(dateStr);

    try {
      await api.setAvailability(dateStr, !isCurrentlyAvailable);

      if (isCurrentlyAvailable) {
        setMyDates(myDates.filter(d => d !== dateStr));
      } else {
        setMyDates([...myDates, dateStr]);
      }

      // Refresh all availability
      const allAvail = await api.getCalendar(monthStr);
      setAvailability(allAvail);
    } catch (err) {
      console.error('Failed to update availability:', err);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const getDateStr = (day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded"
        >
          &lt;
        </button>
        <h2 className="font-semibold text-lg">
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded"
        >
          &gt;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(day => (
          <div key={day} className="text-center text-xs text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (!day) {
              return <div key={idx} className="aspect-square" />;
            }

            const dateStr = getDateStr(day);
            const isAvailable = myDates.includes(dateStr);
            const usersAvailable = availability[dateStr] || [];
            const count = usersAvailable.length;

            return (
              <button
                key={idx}
                onClick={() => toggleAvailability(day)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSelectedDay(selectedDay === day ? null : day);
                }}
                className={`
                  aspect-square rounded-lg text-sm relative
                  flex flex-col items-center justify-center
                  transition-colors
                  ${isAvailable
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                  }
                `}
              >
                <span>{day}</span>
                {count > 0 && (
                  <span className="text-[10px] text-gray-500">
                    {count} free
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selectedDay && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">
            {MONTHS[month]} {selectedDay} - Available:
          </h3>
          {availability[getDateStr(selectedDay)]?.length > 0 ? (
            <ul className="text-sm text-gray-600">
              {availability[getDateStr(selectedDay)].map(user => (
                <li key={user.userId}>{user.displayName}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No one available</p>
          )}
          <button
            onClick={() => setSelectedDay(null)}
            className="mt-2 text-xs text-blue-600"
          >
            Close
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4 text-center">
        Tap a day to toggle your availability. Long-press to see who's free.
      </p>
    </div>
  );
}
