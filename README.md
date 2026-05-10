# Friend Planner

A web app for coordinating events with a group of friends. Features shared availability calendar, activity voting, and invite-only registration.

## Features

- **User Accounts**: Invite-only registration via admin-generated links
- **Shared Calendar**: Mark your availability by day, see who's free
- **Activities**: Add activity ideas with descriptions, locations, dates, and links
- **Anonymous Voting**: Rate activities 1-5 stars, see group averages
- **Mobile-First**: Designed for phone use

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: JWT tokens

## Local Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database

### 1. Set up the database

Create a PostgreSQL database and run the schema:

```bash
psql -d your_database_name -f server/src/db/schema.sql
```

### 2. Configure environment variables

**Server** (`server/.env`):
```
DATABASE_URL=postgresql://username:password@localhost:5432/friend_planner
JWT_SECRET=your-secret-key-here
PORT=3001
```

### 3. Install dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 4. Create admin user

Run this SQL to create your admin account (replace values):

```sql
INSERT INTO users (email, password_hash, display_name, is_admin)
VALUES (
  'your@email.com',
  '$2a$10$YOUR_BCRYPT_HASH_HERE',
  'Your Name',
  true
);
```

To generate a password hash, you can run:
```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

### 5. Start the app

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

Visit http://localhost:5173

## Deployment to Render

### 1. Create PostgreSQL database

- Go to Render Dashboard > New > PostgreSQL
- Copy the Internal Database URL

### 2. Deploy backend

- New > Web Service
- Connect your repo
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Add environment variables:
  - `DATABASE_URL`: (paste Internal URL)
  - `JWT_SECRET`: (generate a random string)
  - `NODE_ENV`: `production`

### 3. Deploy frontend

- New > Static Site
- Connect your repo
- Root Directory: `client`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Add environment variable:
  - `VITE_API_URL`: (your backend URL, e.g., https://your-app.onrender.com)

### 4. Run database schema

Connect to your Render PostgreSQL and run the schema.sql contents.

## Usage

1. Log in as admin
2. Go to Admin page, create an invite link
3. Share link with friends
4. Friends register and can mark availability + add/vote on activities
