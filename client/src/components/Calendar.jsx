import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState({});
  const [myDates, setMyDates] = useState([]);
  const [events, setEvents] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [eventDays, setEventDays] = useState(1);
  const [addingEvent, setAddingEvent] = useState(false);
  const longPressTimer = useRef(null);
  const isLongPress = useRef(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const loadData = async () => {
    setLoading(true);
    try {
      const [allAvail, myAvail, calEvents] = await Promise.all([
        api.getCalendar(monthStr),
        api.getMyAvailability(monthStr),
        api.getCalendarEvents(monthStr)
      ]);
      setAvailability(allAvail);
      setMyDates(myAvail);
      setEvents(calEvents);
    } catch (err) {
      console.error('Failed to load calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  const handleTouchStart = (day) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setSelectedDay(selectedDay === day ? null : day);
    }, 500);
  };

  const handleTouchEnd = (day) => {
    clearTimeout(longPressTimer.current);
    if (!isLongPress.current) {
      toggleAvailability(day);
    }
  };

  const handleTouchMove = () => {
    clearTimeout(longPressTimer.current);
  };

  const openAddEvent = async () => {
    try {
      const acts = await api.getActivities();
      setActivities(acts);
      setSelectedActivity(null);
      setEventDays(1);
      setShowAddEvent(true);
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  };

  const handleAddEvent = async () => {
    if (!selectedActivity || !selectedDay) return;

    setAddingEvent(true);
    try {
      await api.addCalendarEvent(selectedActivity, getDateStr(selectedDay), eventDays);
      await loadData();
      setShowAddEvent(false);
    } catch (err) {
      console.error('Failed to add event:', err);
    } finally {
      setAddingEvent(false);
    }
  };

  const handleRemoveEvent = async (eventId) => {
    try {
      await api.deleteCalendarEvent(eventId);
      await loadData();
    } catch (err) {
      console.error('Failed to remove event:', err);
    }
  };

  const handleRsvp = async (eventId, status) => {
    try {
      await api.rsvpToEvent(eventId, status);
      await loadData();
    } catch (err) {
      console.error('Failed to RSVP:', err);
    }
  };

  const getGoogleCalendarUrl = (event, dateStr) => {
    const title = encodeURIComponent(event.activityName);
    // Format date as YYYYMMDD for all-day event
    const formattedDate = dateStr.replace(/-/g, '');
    // End date is next day for all-day events
    const endDate = new Date(dateStr);
    endDate.setDate(endDate.getDate() + 1);
    const formattedEndDate = endDate.toISOString().split('T')[0].replace(/-/g, '');

    const details = encodeURIComponent('Cabin Crewtivities event');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formattedDate}/${formattedEndDate}&details=${details}`;
  };

  const dayEvents = selectedDay ? (events[getDateStr(selectedDay)] || []) : [];

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
            const dayHasEvents = events[dateStr]?.length > 0;

            return (
              <button
                key={idx}
                onClick={() => {
                  if (!('ontouchstart' in window)) {
                    toggleAvailability(day);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSelectedDay(selectedDay === day ? null : day);
                }}
                onTouchStart={() => handleTouchStart(day)}
                onTouchEnd={() => handleTouchEnd(day)}
                onTouchMove={handleTouchMove}
                className={`
                  aspect-square rounded-lg text-sm relative
                  flex flex-col items-center justify-center
                  transition-colors select-none
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
                {dayHasEvents && (
                  <span className="absolute bottom-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selectedDay && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg relative">
          <button
            onClick={() => setSelectedDay(null)}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full text-lg leading-none"
          >
            &times;
          </button>
          <h3 className="font-medium mb-2 pr-6">
            {MONTHS[month]} {selectedDay}
          </h3>

          {/* Events Section */}
          {dayEvents.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-600 mb-2">Events:</p>
              <div className="space-y-3">
                {dayEvents.map(event => (
                  <div key={event.id} className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-blue-800">{event.activityName}</span>
                      <button
                        onClick={() => handleRemoveEvent(event.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    </div>

                    {/* RSVP Buttons */}
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => handleRsvp(event.id, 'attending')}
                        className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
                          event.myRsvp === 'attending'
                            ? 'bg-green-600 text-white'
                            : 'bg-white border border-green-600 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        Attending
                      </button>
                      <button
                        onClick={() => handleRsvp(event.id, 'declined')}
                        className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
                          event.myRsvp === 'declined'
                            ? 'bg-red-600 text-white'
                            : 'bg-white border border-red-400 text-red-600 hover:bg-red-50'
                        }`}
                      >
                        Can't Make It
                      </button>
                    </div>

                    {/* Attendees */}
                    {(event.rsvps?.attending?.length > 0 || event.rsvps?.declined?.length > 0) && (
                      <div className="text-xs space-y-1 mb-2">
                        {event.rsvps?.attending?.length > 0 && (
                          <p className="text-green-700">
                            <span className="font-medium">Going:</span>{' '}
                            {event.rsvps.attending.map(u => u.displayName).join(', ')}
                          </p>
                        )}
                        {event.rsvps?.declined?.length > 0 && (
                          <p className="text-red-600">
                            <span className="font-medium">Can't go:</span>{' '}
                            {event.rsvps.declined.map(u => u.displayName).join(', ')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Add to Google Calendar */}
                    <a
                      href={getGoogleCalendarUrl(event, getDateStr(selectedDay))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                      </svg>
                      Add to Google Calendar
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Availability Section */}
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-600 mb-1">Available:</p>
            {availability[getDateStr(selectedDay)]?.length > 0 ? (
              <ul className="text-sm text-gray-600">
                {availability[getDateStr(selectedDay)].map(user => (
                  <li key={user.userId}>{user.displayName}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No one available</p>
            )}
          </div>

          {/* Add Event Button */}
          <button
            onClick={openAddEvent}
            className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700"
          >
            + Add Event
          </button>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowAddEvent(false)}
        >
          <div className="bg-white rounded-lg w-full max-w-sm">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Add Event to {MONTHS[month]} {selectedDay}</h3>
              <button
                onClick={() => setShowAddEvent(false)}
                className="text-gray-500 text-xl"
              >
                &times;
              </button>
            </div>

            <div className="p-4">
              <label className="block text-sm font-medium mb-2">Select Activity:</label>
              {activities.length === 0 ? (
                <p className="text-gray-500 text-sm">No activities yet. Add one first!</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                  {activities.map(activity => (
                    <button
                      key={activity.id}
                      onClick={() => setSelectedActivity(activity.id)}
                      className={`w-full text-left p-2 rounded border transition-colors ${
                        selectedActivity === activity.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">{activity.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({activity.avgRating.toFixed(1)} avg)
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <label className="block text-sm font-medium mb-2">Number of days:</label>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                  <button
                    key={num}
                    onClick={() => setEventDays(num)}
                    className={`w-8 h-8 rounded ${
                      eventDays === num
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mb-4">
                {eventDays === 1
                  ? 'Event will be added to this day only.'
                  : `Event will be added to ${eventDays} consecutive days starting ${MONTHS[month]} ${selectedDay}.`
                }
              </p>

              <button
                onClick={handleAddEvent}
                disabled={!selectedActivity || addingEvent}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {addingEvent ? 'Adding...' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4 text-center">
        Tap a day to toggle your availability. Long-press to see details & add events.
      </p>
    </div>
  );
}
