/**
 * Campus Event Tracker - Main Server
 * Express.js server with SQLite database integration
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const { initDatabase, getDatabase } = require('./models/database');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================

// Enable CORS for local development
app.use(cors());

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../client')));

// API routes
app.use('/api', apiRoutes);

// ============================================
// Page Routes - Serve HTML pages
// ============================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/events', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/events.html'));
});

app.get('/host', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/host.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/contact.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/admin.html'));
});

// ============================================
// Error handling middleware
// ============================================

app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    if (err.name === 'MulterError') {
        return res.status(400).json({ success: false, message: 'File upload error: ' + err.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../client/index.html'));
});

// ============================================
// Start Server
// ============================================

async function startServer() {
    try {
        // Initialize database
        await initDatabase();
        console.log('✅ Database ready');

        // Start Express server
        const server = app.listen(PORT, () => {
            console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║     🎓 Campus Event Tracker Server               ║
║                                                  ║
║     Running on: http://localhost:${PORT}            ║
║     API Base:   http://localhost:${PORT}/api        ║
║                                                  ║
║     Ready to track amazing campus events! 🚀     ║
║                                                  ║
╚══════════════════════════════════════════════════╝
            `);
        });

        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
                app.listen(PORT + 1, () => {
                    console.log(`Server running on alternate port: http://localhost:${PORT + 1}`);
                });
            } else {
                throw error;
            }
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
