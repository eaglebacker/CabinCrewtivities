const API_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email, password, displayName, inviteCode) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName, inviteCode }),
    }),

  getMe: () => request('/api/auth/me'),

  // Invites
  validateInvite: (code) => request(`/api/invites/validate/${code}`),
  createInvite: () => request('/api/invites', { method: 'POST' }),
  getInvites: () => request('/api/invites'),
  deleteInvite: (id) => request(`/api/invites/${id}`, { method: 'DELETE' }),

  // Calendar
  getCalendar: (month) => request(`/api/calendar?month=${month}`),
  getMyAvailability: (month) => request(`/api/calendar/me?month=${month}`),
  setAvailability: (date, isAvailable) =>
    request('/api/calendar', {
      method: 'POST',
      body: JSON.stringify({ date, isAvailable }),
    }),

  // Calendar Events
  getCalendarEvents: (month) => request(`/api/calendar/events?month=${month}`),
  addCalendarEvent: (activityId, date, days = 1) =>
    request('/api/calendar/events', {
      method: 'POST',
      body: JSON.stringify({ activityId, date, days }),
    }),
  deleteCalendarEvent: (id) =>
    request(`/api/calendar/events/${id}`, { method: 'DELETE' }),

  // RSVPs
  rsvpToEvent: (eventId, status) =>
    request(`/api/calendar/events/${eventId}/rsvp`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  removeRsvp: (eventId) =>
    request(`/api/calendar/events/${eventId}/rsvp`, { method: 'DELETE' }),

  // Activities
  getActivities: () => request('/api/activities'),
  getActivity: (id) => request(`/api/activities/${id}`),
  createActivity: (data) =>
    request('/api/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateActivity: (id, data) =>
    request(`/api/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteActivity: (id) =>
    request(`/api/activities/${id}`, { method: 'DELETE' }),
  vote: (activityId, rating) =>
    request(`/api/activities/${activityId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    }),
  getMyVote: (activityId) => request(`/api/activities/${activityId}/vote`),

  // Users
  getUsers: () => request('/api/users'),
};
