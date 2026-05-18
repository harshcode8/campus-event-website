/**
 * API Routes - Defines all REST API endpoints
 */

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const multer = require('multer');
const path = require('path');

// ============================================
// Multer configuration for file uploads
// ============================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// ============================================
// Event Routes
// ============================================

// Get all events (with filters)
router.get('/events', eventController.getEvents);

// Get latest events
router.get('/events/latest', eventController.getLatestEvents);

// Get trending events
router.get('/events/trending', eventController.getTrendingEvents);

// Get platform statistics
router.get('/statistics', eventController.getStatistics);

// Get single event by ID
router.get('/events/:id', eventController.getEventById);

// Check if device joined event
router.get('/events/:id/joined', eventController.checkJoined);

// Create new event (with image upload)
router.post('/events', upload.single('banner'), eventController.createEvent);

// Join an event
router.post('/events/:id/join', eventController.joinEvent);

// Delete an event (admin)
router.delete('/events/:id', eventController.deleteEvent);

module.exports = router;
