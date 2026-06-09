# 🎓 Campus Event Tracker

A modern, fully-functional campus event management platform built with **Node.js**, **Express**, and **SQLite**. Features a glassmorphism UI, real-time statistics, event hosting, and a smart anti-rejoin system — works completely offline on localhost.

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## 👨‍💻 Developer

### Harsh Kumar
Full-Stack Developer | AI & Fullstack Developer

### 🔗 Connect With Me

- GitHub: https://github.com/harshcode8
- LinkedIn: (https://www.linkedin.com/in/harsh-kumar-627a6b2b4)
- Email: mailto:hrsh0018@gmail.com
---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Usage Guide](#-usage-guide)
- [API Endpoints](#-api-endpoints)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

- 🎨 **Glassmorphism UI** — modern frosted glass design with dark/light mode
- 📅 **Browse & Filter Events** — search, sort, and filter by category, fee, date
- 🚀 **Host Events** — submit events with image upload, Google Form, WhatsApp links
- 🔒 **Anti-Rejoin System** — browser fingerprinting prevents duplicate joins
- 📊 **Admin Dashboard** — live statistics and SQL viewer
- 📱 **Fully Responsive** — works on desktop, tablet, and mobile
- ⚡ **No Login Required** — seamless experience, works 100% offline on localhost

---

## 🛠️ Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript   |
| Backend  | Node.js, Express.js               |
| Database | SQLite3 (auto-created on startup) |
| Uploads  | Multer                            |

---

## 📁 Project Structure

```
campus-event-tracker/
├── client/                  # Frontend
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js
│   │   ├── home.js
│   │   ├── events.js
│   │   └── host.js
│   ├── assets/
│   │   └── favicon.svg
│   ├── index.html
│   ├── events.html
│   ├── host.html
│   ├── about.html
│   ├── contact.html
│   └── admin.html
├── server/                  # Backend
│   ├── index.js             # Main server entry point
│   ├── routes/
│   │   └── api.js
│   ├── controllers/
│   │   └── eventController.js
│   └── models/
│       ├── database.js      # DB init + seed data
│       └── eventModel.js
├── database/                # Auto-created on first run
│   └── .gitkeep
├── uploads/                 # Sample event images + user uploads
│   ├── .gitkeep
│   ├── event1.jpg
│   └── ... (event2 to event8)
├── public/
│   └── .gitkeep
├── .gitignore
├── package.json
└── README.md
```

---

## ✅ Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js v18 or higher** → [Download from nodejs.org](https://nodejs.org/)
- **npm** (comes bundled with Node.js — no separate install needed)
- **Git** → [Download from git-scm.com](https://git-scm.com/)

To verify your installation, open a terminal and run:

```bash
node --version
npm --version
```

Both commands should print a version number without errors.

---

## 🚀 Installation & Setup

### Step 1 — Clone the repository.

```bash
git clone https://github.com/YOUR_USERNAME/campus-event-tracker.git
```

### Step 2 — Navigate into the project folder.

```bash
cd campus-event-tracker
```

### Step 3 — Install dependencies.

```bash
npm install
```

This reads `package.json` and installs all required packages into a `node_modules/` folder. It takes about 30–60 seconds.

### Step 4 — Start the server

```bash
npm start
```

You should see this output:

```
✅ Connected to SQLite database
📦 Seeding database with sample data...
✅ Database ready

╔══════════════════════════════════════════════════╗
║                                                  ║
║     🎓 Campus Event Tracker Server               ║
║                                                  ║
║     Running on: http://localhost:3000            ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

> **Note:** The database is created automatically on first run. You will see "Seeding database with sample data..." only once — on the very first startup. After that, it won't seed again.

### Step 5 — Open in your browser

```
http://localhost:3000
```

That's it! The app is running with **8 sample events** pre-loaded. No extra configuration needed.

---

## 📖 Usage Guide

### For Students (Browse & Join Events)

1. Go to **http://localhost:3000/events**
2. Use the search bar or filter by category, fee, date
3. Click **"View Details"** on any event card
4. Click **"Join Event"** → confirm in the popup
5. The join count updates instantly
6. The button shows **"Already Joined"** if you visit again (anti-rejoin system)

### For Organizers (Host an Event)

1. Go to **http://localhost:3000/host**
2. Fill in event name, category, venue, dates, fee
3. Upload a banner image (drag & drop supported, max 5MB)
4. Optionally add Google Form link, WhatsApp group link, external website
5. Click **"Create Event"** — it appears on the events page immediately

### For Admins

1. Go to **http://localhost:3000/admin**
2. View live platform statistics
3. Browse all database tables
4. Run custom SQL queries using the SQL viewer

---

## 📡 API Endpoints

| Method | Endpoint                    | Description                   |
|--------|-----------------------------|-------------------------------|
| GET    | `/api/events`               | Get all events (with filters) |
| GET    | `/api/events/latest`        | Get latest events             |
| GET    | `/api/events/trending`      | Get trending events           |
| GET    | `/api/events/:id`           | Get a single event            |
| POST   | `/api/events`               | Create a new event            |
| POST   | `/api/events/:id/join`      | Join an event                 |
| GET    | `/api/events/:id/joined`    | Check join status             |
| GET    | `/api/statistics`           | Get platform statistics       |

**Query parameters for `GET /api/events`:**

| Parameter  | Description                               |
|------------|-------------------------------------------|
| `search`   | Search by event name or description       |
| `category` | Filter by category (e.g. Hackathon)       |
| `sort`     | Sort by: `latest`, `fee_low`, `fee_high`, `last_date` |
| `limit`    | Limit number of results returned          |

---

## 🔧 Troubleshooting

**Port 3000 already in use?**
```bash
PORT=3001 npm start
```
Then open `http://localhost:3001`

**`npm install` fails?**

Make sure Node.js v18+ is installed:
```bash
node --version
```
If the version is below 18, update Node.js from [nodejs.org](https://nodejs.org/).

**Events not showing / blank page?**

Make sure the server is running (Step 4 above). Open browser console (F12) and check for errors.

**Images broken for sample events?**

Make sure the `uploads/` folder contains `event1.jpg` through `event8.jpg`. These should be present if you cloned from GitHub. If missing, re-clone the repo.

**Want to reset the database?**

Stop the server, delete `database/campus_events.db`, then run `npm start` again. The database will be recreated with fresh sample data.

---

## 📱 Browser Compatibility

| Browser        | Status       |
|----------------|--------------|
| Chrome / Edge  | ✅ Recommended |
| Firefox        | ✅ Supported   |
| Safari         | ✅ Supported   |
| Mobile browsers| ✅ Supported   |

---

## 📄 License

This project is built for educational purposes and is available under the **MIT License**.

---

**Built with ❤️ by Harsh Kumar
