/**
 * Event Controller - Handles API request/response for event operations
 */

const eventModel = require('../models/eventModel');

/**
 * GET /api/events - Fetch all events with optional filters
 * Query params: search, sort, category
 */
async function getEvents(req, res) {
    try {
        const options = {
            search: req.query.search || '',
            sort: req.query.sort || 'latest',
            category: req.query.category || 'All'
        };
        const events = await eventModel.getAllEvents(options);
        res.json({ success: true, data: events, count: events.length });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
}

/**
 * GET /api/events/latest - Fetch latest events
 */
async function getLatestEvents(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 3;
        const events = await eventModel.getLatestEvents(limit);
        res.json({ success: true, data: events });
    } catch (error) {
        console.error('Error fetching latest events:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch latest events' });
    }
}

/**
 * GET /api/events/trending - Fetch trending events
 */
async function getTrendingEvents(req, res) {
    try {
        const events = await eventModel.getTrendingEvents();
        res.json({ success: true, data: events });
    } catch (error) {
        console.error('Error fetching trending events:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch trending events' });
    }
}

/**
 * GET /api/events/:id - Fetch a single event by ID
 */
async function getEventById(req, res) {
    try {
        const event = await eventModel.getEventById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        res.json({ success: true, data: event });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch event' });
    }
}

/**
 * POST /api/events - Create a new event
 */
async function createEvent(req, res) {
    try {
        const eventData = {
            ...req.body,
            image_path: req.file ? `/uploads/${req.file.filename}` : '/uploads/default-event.jpg'
        };

        // Parse gallery images if provided
        if (req.files && req.files.gallery) {
            const galleryPaths = req.files.gallery.map(f => `/uploads/${f.filename}`);
            eventData.gallery_images = JSON.stringify(galleryPaths);
        }

        const result = await eventModel.createEvent(eventData);
        res.status(201).json({ success: true, message: 'Event created successfully!', data: { id: result.id } });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ success: false, message: 'Failed to create event' });
    }
}

/**
 * POST /api/events/:id/join - Join an event
 * Returns contact details (google_form_link, whatsapp_link, external_link) and
 * how_to_join instructions after successful join
 */
async function joinEvent(req, res) {
    try {
        const { deviceId } = req.body;
        if (!deviceId) {
            return res.status(400).json({ success: false, message: 'Device identifier required' });
        }

        const eventId = req.params.id;

        // Verify event exists and get contact details
        const event = await eventModel.getEventById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const result = await eventModel.joinEvent(eventId, deviceId);

        if (result.alreadyJoined) {
            // Even if already joined, return contact details so user can see them
            return res.json({
                success: true,
                message: result.message,
                alreadyJoined: true,
                contactDetails: {
                    google_form_link: event.google_form_link,
                    whatsapp_link: event.whatsapp_link,
                    external_link: event.external_link,
                    how_to_join: event.how_to_join
                }
            });
        }

        // Successful join - return contact details
        res.json({
            success: true,
            message: result.message,
            alreadyJoined: false,
            contactDetails: {
                google_form_link: event.google_form_link,
                whatsapp_link: event.whatsapp_link,
                external_link: event.external_link,
                how_to_join: event.how_to_join
            }
        });
    } catch (error) {
        console.error('Error joining event:', error);
        res.status(500).json({ success: false, message: 'Failed to join event' });
    }
}

/**
 * GET /api/events/:id/joined - Check if device has joined event
 */
async function checkJoined(req, res) {
    try {
        const deviceId = req.query.deviceId;
        if (!deviceId) {
            return res.json({ success: true, joined: false });
        }

        const joined = await eventModel.hasJoinedEvent(req.params.id, deviceId);
        res.json({ success: true, joined });
    } catch (error) {
        console.error('Error checking join status:', error);
        res.status(500).json({ success: false, message: 'Failed to check join status' });
    }
}

/**
 * GET /api/statistics - Fetch platform statistics
 */
async function getStatistics(req, res) {
    try {
        const stats = await eventModel.getStatistics();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
    }
}

/**
 * DELETE /api/events/:id - Delete an event (admin)
 */
async function deleteEvent(req, res) {
    try {
        await eventModel.deleteEvent(req.params.id);
        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ success: false, message: 'Failed to delete event' });
    }
}

module.exports = {
    getEvents,
    getLatestEvents,
    getTrendingEvents,
    getEventById,
    createEvent,
    joinEvent,
    checkJoined,
    getStatistics,
    deleteEvent
};
