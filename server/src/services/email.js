const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'Cabin Crewtivities <onboarding@resend.dev>';
const APP_URL = process.env.APP_URL || 'https://cabincrewtivities.onrender.com';

async function sendNotification(to, subject, html) {
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not set, skipping email');
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

async function notifyNewActivity(db, activity, createdByName) {
  // Get all users with notifications enabled (except the creator)
  const result = await db.query(
    `SELECT email, display_name FROM users
     WHERE email_notifications = true AND id != $1`,
    [activity.created_by]
  );

  const users = result.rows;
  if (users.length === 0) return;

  const subject = `New Crewtivity: ${activity.name}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #8B4513; padding: 20px; text-align: center;">
        <h1 style="color: #FDF8F0; margin: 0;">Cabin Crewtivities</h1>
      </div>
      <div style="padding: 20px; background-color: #FDF8F0;">
        <h2 style="color: #6B3410;">New Activity Added!</h2>
        <p style="color: #8B4513;"><strong>${createdByName}</strong> added a new activity:</p>
        <div style="background-color: #F5DEB3; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="color: #6B3410; margin-top: 0;">${activity.name}</h3>
          ${activity.description ? `<p style="color: #8B4513;">${activity.description}</p>` : ''}
        </div>
        <p style="color: #8B4513;">Log in to vote and see more details!</p>
        <a href="${APP_URL}" style="display: inline-block; background-color: #2D5A27; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Activities</a>
      </div>
      <div style="padding: 15px; text-align: center; color: #8B4513; font-size: 12px;">
        <p>You're receiving this because you have notifications enabled.</p>
        <p>Log in to manage your notification preferences.</p>
      </div>
    </div>
  `;

  // Send to all users (in parallel)
  await Promise.all(
    users.map(user => sendNotification(user.email, subject, html))
  );
}

async function notifyEventScheduled(db, eventData, createdByName) {
  // Get all users with notifications enabled (except the creator)
  const result = await db.query(
    `SELECT email, display_name FROM users
     WHERE email_notifications = true AND id != $1`,
    [eventData.created_by]
  );

  const users = result.rows;
  if (users.length === 0) return;

  const eventDate = new Date(eventData.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const subject = `Event Scheduled: ${eventData.activity_name}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #8B4513; padding: 20px; text-align: center;">
        <h1 style="color: #FDF8F0; margin: 0;">Cabin Crewtivities</h1>
      </div>
      <div style="padding: 20px; background-color: #FDF8F0;">
        <h2 style="color: #6B3410;">Event Scheduled!</h2>
        <p style="color: #8B4513;"><strong>${createdByName}</strong> scheduled an event:</p>
        <div style="background-color: #F5DEB3; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="color: #6B3410; margin-top: 0;">${eventData.activity_name}</h3>
          <p style="color: #8B4513; margin-bottom: 0;">
            <strong>Date:</strong> ${eventDate}
          </p>
        </div>
        <p style="color: #8B4513;">Log in to RSVP and add it to your calendar!</p>
        <a href="${APP_URL}" style="display: inline-block; background-color: #2D5A27; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Calendar</a>
      </div>
      <div style="padding: 15px; text-align: center; color: #8B4513; font-size: 12px;">
        <p>You're receiving this because you have notifications enabled.</p>
        <p>Log in to manage your notification preferences.</p>
      </div>
    </div>
  `;

  // Send to all users (in parallel)
  await Promise.all(
    users.map(user => sendNotification(user.email, subject, html))
  );
}

module.exports = {
  sendNotification,
  notifyNewActivity,
  notifyEventScheduled
};
