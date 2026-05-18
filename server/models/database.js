/**
 * Database Initialization Module
 * Uses sqlite3 - works on ALL Node.js versions, no compilation needed
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../database/campus_events.db');
let db = null;

// Promise wrappers so the rest of the app works identically
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ id: this.lastID, changes: this.changes });
        });
    });
}

function getRow(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

function getRows(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

function execSQL(sql) {
    return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

/**
 * Initialize database with schema and seed data
 */
async function initDatabase() {
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new sqlite3.Database(DB_PATH);
    console.log('✅ Connected to SQLite database');

    await execSQL('PRAGMA journal_mode = WAL;');
    await execSQL('PRAGMA foreign_keys = ON;');

    // Create tables
    await execSQL(`
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_name TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            organizer_name TEXT NOT NULL,
            contact TEXT,
            email TEXT,
            venue TEXT NOT NULL,
            mode TEXT NOT NULL DEFAULT 'Offline',
            last_date TEXT NOT NULL,
            event_date TEXT NOT NULL,
            event_time TEXT DEFAULT '10:00 AM',
            fee REAL DEFAULT 0,
            image_path TEXT DEFAULT '/uploads/default-event.jpg',
            gallery_images TEXT DEFAULT '[]',
            google_form_link TEXT,
            whatsapp_link TEXT,
            external_link TEXT,
            custom_instructions TEXT,
            how_to_join TEXT,
            rules TEXT,
            joined_count INTEGER DEFAULT 0,
            trending INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS event_joins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            device_identifier TEXT NOT NULL,
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
            UNIQUE(event_id, device_identifier)
        );

        CREATE TABLE IF NOT EXISTS statistics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stat_key TEXT NOT NULL UNIQUE,
            stat_value INTEGER DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS organizers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT,
            contact TEXT,
            team_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Seed data only if empty
    const row = await getRow('SELECT COUNT(*) as count FROM events');
    if (row.count === 0) {
        console.log('📦 Seeding database with sample data...');

        const events = [
            ['TechVista 2025', 'Hackathon', 'A 24-hour national-level hackathon bringing together the brightest minds to build innovative solutions for real-world problems.', 'ACM Student Chapter', '+91 9876543210', 'techvista@campus.edu', 'Main Auditorium, Block A', 'Offline', '2025-08-15', '2025-08-20', '09:00 AM', 200, '/uploads/event1.jpg', 'https://forms.gle/techvista2025', 'https://chat.whatsapp.com/techvista', 'https://techvista.campus.edu', 'Bring your laptop and charger.', '1. Click Join\n2. Fill Google Form\n3. Join WhatsApp group', '1. Max 4 members\n2. Must be a student', 156, 1],
            ['Cultural Night Extravaganza', 'Cultural', 'An evening of music, dance, drama, and art celebrating the diverse cultural heritage of our campus.', 'Cultural Committee', '+91 9876543211', 'cultural@campus.edu', 'Open Air Theatre', 'Offline', '2025-07-10', '2025-07-14', '06:00 PM', 0, '/uploads/event2.jpg', 'https://forms.gle/culturalnight', 'https://chat.whatsapp.com/cultural', 'https://cultural.campus.edu', 'Register your performance category during sign-up.', '1. Click Join\n2. Fill the form\n3. Join WhatsApp', '1. 5 minute time limit\n2. No offensive content', 243, 1],
            ['AI/ML Workshop Series', 'Workshop', 'A 3-day intensive workshop on AI and ML covering neural networks, NLP, and computer vision.', 'Department of CS', '+91 9876543212', 'aiml@campus.edu', 'CS Lab 301, Block C', 'Hybrid', '2025-09-20', '2025-09-25', '10:00 AM', 150, '/uploads/event3.jpg', 'https://forms.gle/aimlworkshop', 'https://chat.whatsapp.com/aiml', 'https://aiml.campus.edu', 'Install Python 3.8+ before attending.', '1. Click Join\n2. Fill form\n3. Install Python', '1. Basic Python required\n2. Must attend all 3 days for certificate', 89, 0],
            ['Inter-College Basketball Tournament', 'Sports', 'Annual inter-college basketball tournament featuring 16 teams from across the state.', 'Sports Committee', '+91 9876543213', 'sports@campus.edu', 'Indoor Sports Complex', 'Offline', '2025-07-12', '2025-07-18', '08:00 AM', 500, '/uploads/event4.jpg', 'https://forms.gle/basketball', 'https://chat.whatsapp.com/basketball', 'https://sports.campus.edu', 'Bring college ID and sports kit.', '1. Click Join\n2. Fill roster form\n3. Carry college ID', '1. Teams of 7-12\n2. FIBA rules apply', 67, 0],
            ['Startup Pitch Competition', 'Seminar', 'Present your startup idea to a panel of VCs and angel investors.', 'E-Cell', '+91 9876543214', 'ecell@campus.edu', 'Seminar Hall, Block B', 'Offline', '2025-09-28', '2025-10-05', '02:00 PM', 100, '/uploads/event5.jpg', 'https://forms.gle/startuppitch', 'https://chat.whatsapp.com/startup', 'https://ecell.campus.edu', 'Prepare a 10-minute pitch deck.', '1. Click Join\n2. Fill form\n3. Prepare 10 slides', '1. Max 3 members\n2. Original idea only', 112, 1],
            ['Web Development Bootcamp', 'Technical', 'A 2-day bootcamp covering React, Node.js, and MongoDB.', 'Google DSC', '+91 9876543215', 'dsc@campus.edu', 'IT Lab 201, Block D', 'Hybrid', '2025-10-01', '2025-10-08', '09:30 AM', 0, '/uploads/event6.jpg', 'https://forms.gle/webdevbootcamp', 'https://chat.whatsapp.com/webdev', 'https://dsc.campus.edu', 'Install VS Code and Node.js before bootcamp.', '1. Click Join\n2. Fill skill level form\n3. Install VS Code', '1. Bring your own laptop\n2. Certificate on completion', 78, 0],
            ['Annual Science Exhibition', 'Technical', 'Showcase your innovative science projects and research work.', 'Science Club', '+91 9876543216', 'science@campus.edu', 'Exhibition Hall, Ground Floor', 'Offline', '2025-10-05', '2025-10-10', '10:00 AM', 50, '/uploads/event7.jpg', 'https://forms.gle/sciexhibition', 'https://chat.whatsapp.com/science', 'https://science.campus.edu', 'Set up your display by 9 AM.', '1. Click Join\n2. Submit project abstract\n3. Prepare poster', '1. Max 4 members\n2. Original research only', 45, 0],
            ['Cybersecurity Awareness Seminar', 'Seminar', 'Learn about the latest cyber threats, ethical hacking, and how to protect yourself online.', 'Cybersecurity Club', '+91 9876543217', 'cyber@campus.edu', 'Virtual (Google Meet)', 'Online', '2025-10-15', '2025-10-18', '11:00 AM', 0, '/uploads/event8.jpg', 'https://forms.gle/cyberseminar', 'https://chat.whatsapp.com/cyber', 'https://cyber.campus.edu', 'Google Meet link sent 1 hour before event.', '1. Click Join\n2. Fill form with email\n3. Check email for Meet link', '1. Open to all students\n2. E-certificates for attendees', 134, 1]
        ];

        for (const ev of events) {
            await runQuery(`INSERT INTO events (
                event_name, category, description, organizer_name, contact, email,
                venue, mode, last_date, event_date, event_time, fee, image_path,
                google_form_link, whatsapp_link, external_link, custom_instructions,
                how_to_join, rules, joined_count, trending
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, ev);
        }

        await execSQL(`
            INSERT OR IGNORE INTO statistics (stat_key, stat_value) VALUES ('live_events', 8);
            INSERT OR IGNORE INTO statistics (stat_key, stat_value) VALUES ('total_events', 8);
            INSERT OR IGNORE INTO statistics (stat_key, stat_value) VALUES ('total_joins', 924);
            INSERT OR IGNORE INTO statistics (stat_key, stat_value) VALUES ('total_students', 580);
        `);

        await execSQL(`
            INSERT OR IGNORE INTO organizers (name, email, contact, team_name) VALUES ('ACM Student Chapter', 'techvista@campus.edu', '+91 9876543210', 'ACM Chapter');
            INSERT OR IGNORE INTO organizers (name, email, contact, team_name) VALUES ('Cultural Committee', 'cultural@campus.edu', '+91 9876543211', 'Cultural Committee');
        `);

        console.log('✅ Sample data inserted');
    }

    console.log('✅ Database schema initialized');
    return db;
}

function getDatabase() {
    if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
    return db;
}

module.exports = { initDatabase, getDatabase, runQuery, getRow, getRows };