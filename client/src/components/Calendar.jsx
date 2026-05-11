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
    <div className="rounded-lg shadow-md p-4 border-2" style={{ backgroundColor: '#FDF8F0', borderColor: '#DEB887' }}>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded transition-colors"
          style={{ color: '#8B4513' }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#F5DEB3'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          &lt;
        </button>
        <h2 className="font-semibold text-lg" style={{ color: '#6B3410' }}>
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded transition-colors"
          style={{ color: '#8B4513' }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#F5DEB3'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          &gt;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(day => (
          <div key={day} className="text-center text-xs py-1" style={{ color: '#8B4513' }}>
            {day}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8" style={{ color: '#8B4513' }}>Loading...</div>
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
                className="aspect-square rounded-lg text-sm relative flex flex-col items-center justify-center transition-colors select-none"
                style={{
                  backgroundColor: isAvailable ? '#C8E6C9' : '#FFF8F0',
                  color: isAvailable ? '#2D5A27' : '#6B3410',
                  border: '1px solid #DEB887'
                }}
              >
                <span>{day}</span>
                {count > 0 && (
                  <span className="text-[10px]" style={{ color: '#8B4513' }}>
                    {count} free
                  </span>
                )}
                {dayHasEvents && (
                  <span className="absolute bottom-1 w-2 h-2 rounded-full" style={{ backgroundColor: '#8B4513' }}></span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selectedDay && (
        <div className="mt-4 p-3 rounded-lg relative" style={{ backgroundColor: '#F5DEB3' }}>
          <button
            onClick={() => setSelectedDay(null)}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-lg leading-none transition-colors"
            style={{ color: '#8B4513' }}
          >
            &times;
          </button>
          <h3 className="font-medium mb-2 pr-6" style={{ color: '#6B3410' }}>
            {MONTHS[month]} {selectedDay}
          </h3>

          {/* Events Section */}
          {dayEvents.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium mb-2" style={{ color: '#6B3410' }}>Events:</p>
              <div className="space-y-3">
                {dayEvents.map(event => (
                  <div key={event.id} className="p-3 rounded-lg" style={{ backgroundColor: '#FDF8F0', border: '1px solid #DEB887' }}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium" style={{ color: '#6B3410' }}>{event.activityName}</span>
                      <button
                        onClick={() => handleRemoveEvent(event.id)}
                        className="text-red-600 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    </div>

                    {/* RSVP Buttons */}
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => handleRsvp(event.id, 'attending')}
                        className="flex-1 py-1 px-2 rounded text-xs font-medium transition-colors"
                        style={event.myRsvp === 'attending'
                          ? { backgroundColor: '#2D5A27', color: 'white' }
                          : { backgroundColor: '#FFFAF5', border: '1px solid #2D5A27', color: '#2D5A27' }
                        }
                      >
                        Attending
                      </button>
                      <button
                        onClick={() => handleRsvp(event.id, 'declined')}
                        className="flex-1 py-1 px-2 rounded text-xs font-medium transition-colors"
                        style={event.myRsvp === 'declined'
                          ? { backgroundColor: '#A0522D', color: 'white' }
                          : { backgroundColor: '#FFFAF5', border: '1px solid #A0522D', color: '#A0522D' }
                        }
                      >
                        Can't Make It
                      </button>
                    </div>

                    {/* Attendees */}
                    {(event.rsvps?.attending?.length > 0 || event.rsvps?.declined?.length > 0) && (
                      <div className="text-xs space-y-1 mb-2">
                        {event.rsvps?.attending?.length > 0 && (
                          <p style={{ color: '#2D5A27' }}>
                            <span className="font-medium">Going:</span>{' '}
                            {event.rsvps.attending.map(u => u.displayName).join(', ')}
                          </p>
                        )}
                        {event.rsvps?.declined?.length > 0 && (
                          <p style={{ color: '#A0522D' }}>
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
                      className="inline-flex items-center gap-1 text-xs hover:underline"
                      style={{ color: '#8B4513' }}
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
            <p className="text-sm font-medium mb-1" style={{ color: '#6B3410' }}>Available:</p>
            {availability[getDateStr(selectedDay)]?.length > 0 ? (
              <ul className="text-sm" style={{ color: '#6B3410' }}>
                {availability[getDateStr(selectedDay)].map(user => (
                  <li key={user.userId}>{user.displayName}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm" style={{ color: '#8B4513' }}>No one available</p>
            )}
          </div>

          {/* Add Event Button */}
          <button
            onClick={openAddEvent}
            className="w-full text-white py-2 rounded text-sm transition-colors"
            style={{ backgroundColor: '#2D5A27' }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#4A7C43'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#2D5A27'}
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
          <div className="rounded-lg w-full max-w-sm border-2" style={{ backgroundColor: '#FDF8F0', borderColor: '#DEB887' }}>
            <div className="p-4 flex justify-between items-center" style={{ borderBottom: '2px solid #DEB887' }}>
              <h3 className="font-semibold" style={{ color: '#6B3410' }}>Add Event to {MONTHS[month]} {selectedDay}</h3>
              <button
                onClick={() => setShowAddEvent(false)}
                className="text-xl"
                style={{ color: '#8B4513' }}
              >
                &times;
              </button>
            </div>

            <div className="p-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#6B3410' }}>Select Activity:</label>
              {activities.length === 0 ? (
                <p className="text-sm" style={{ color: '#8B4513' }}>No activities yet. Add one first!</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                  {activities.map(activity => (
                    <button
                      key={activity.id}
                      onClick={() => setSelectedActivity(activity.id)}
                      className="w-full text-left p-2 rounded transition-colors"
                      style={selectedActivity === activity.id
                        ? { border: '2px solid #2D5A27', backgroundColor: '#E8F5E9' }
                        : { border: '1px solid #DEB887', backgroundColor: '#FFFAF5' }
                      }
                    >
                      <span className="font-medium" style={{ color: '#6B3410' }}>{activity.name}</span>
                      <span className="text-xs ml-2" style={{ color: '#8B4513' }}>
                        ({activity.avgRating.toFixed(1)} avg)
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <label className="block text-sm font-medium mb-2" style={{ color: '#6B3410' }}>Number of days:</label>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                  <button
                    key={num}
                    onClick={() => setEventDays(num)}
                    className="w-8 h-8 rounded transition-colors"
                    style={eventDays === num
                      ? { backgroundColor: '#2D5A27', color: 'white' }
                      : { backgroundColor: '#F5DEB3', color: '#6B3410' }
                    }
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-xs mb-4" style={{ color: '#8B4513' }}>
                {eventDays === 1
                  ? 'Event will be added to this day only.'
                  : `Event will be added to ${eventDays} consecutive days starting ${MONTHS[month]} ${selectedDay}.`
                }
              </p>

              <button
                onClick={handleAddEvent}
                disabled={!selectedActivity || addingEvent}
                className="w-full text-white py-2 rounded disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#2D5A27' }}
                onMouseOver={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#4A7C43')}
                onMouseOut={(e) => e.target.style.backgroundColor = '#2D5A27'}
              >
                {addingEvent ? 'Adding...' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs mt-4 text-center" style={{ color: '#8B4513' }}>
        Tap a day to toggle your availability. Long-press to see details & add events.
      </p>
    </div>
  );
}
