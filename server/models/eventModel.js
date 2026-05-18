/**
 * Event Model - Handles all event-related database operations
 */

const { runQuery, getRow, getRows } = require('./database');

/**
 * Create a new event
 * @param {Object} eventData - Event details
 * @returns {Promise} - Resolves with the created event ID
 */
async function createEvent(eventData) {
    const sql = `INSERT INTO events (
        event_name, category, description, organizer_name, contact, email,
        venue, mode, last_date, event_date, event_time, fee, image_path,
        gallery_images, google_form_link, whatsapp_link, external_link,
        custom_instructions, rules, trending
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        eventData.event_name,
        eventData.category,
        eventData.description,
        eventData.organizer_name,
        eventData.contact,
        eventData.email,
        eventData.venue,
        eventData.mode,
        eventData.last_date,
        eventData.event_date,
        eventData.event_time,
        eventData.fee || 0,
        eventData.image_path || '/uploads/default-event.jpg',
        eventData.gallery_images || '[]',
        eventData.google_form_link || null,
        eventData.whatsapp_link || null,
        eventData.external_link || null,
        eventData.custom_instructions || null,
        eventData.rules || null,
        eventData.trending || 0
    ];

    const result = await runQuery(sql, params);
    // Update statistics
    await runQuery('UPDATE statistics SET stat_value = stat_value + 1, updated_at = CURRENT_TIMESTAMP WHERE stat_key = ?', ['total_events']);
    await runQuery('UPDATE statistics SET stat_value = stat_value + 1, updated_at = CURRENT_TIMESTAMP WHERE stat_key = ?', ['live_events']);
    return result;
}

/**
 * Get all events with optional filtering and sorting
 * @param {Object} options - Filter and sort options
 * @returns {Promise} - Resolves with array of events
 */
async function getAllEvents(options = {}) {
    let sql = 'SELECT * FROM events WHERE 1=1';
    const params = [];

    // Category filter
    if (options.category && options.category !== 'All') {
        sql += ' AND category = ?';
        params.push(options.category);
    }

    // Search filter
    if (options.search) {
        sql += ' AND (event_name LIKE ? OR description LIKE ? OR organizer_name LIKE ?)';
        const searchTerm = `%${options.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    // Sorting
    switch (options.sort) {
        case 'latest':
            sql += ' ORDER BY created_at DESC';
            break;
        case 'fee_low':
            sql += ' ORDER BY fee ASC';
            break;
        case 'fee_high':
            sql += ' ORDER BY fee DESC';
            break;
        case 'last_date':
            sql += ' ORDER BY last_date ASC';
            break;
        default:
            sql += ' ORDER BY created_at DESC';
    }

    return await getRows(sql, params);
}

/**
 * Get a single event by ID
 * @param {number} id - Event ID
 * @returns {Promise} - Resolves with the event
 */
async function getEventById(id) {
    return await getRow('SELECT * FROM events WHERE id = ?', [id]);
}

/**
 * Get the latest N events
 * @param {number} limit - Number of events to return
 * @returns {Promise} - Resolves with array of events
 */
async function getLatestEvents(limit = 3) {
    return await getRows('SELECT * FROM events ORDER BY created_at DESC LIMIT ?', [limit]);
}

/**
 * Get trending events
 * @returns {Promise} - Resolves with array of trending events
 */
async function getTrendingEvents() {
    return await getRows('SELECT * FROM events WHERE trending = 1 ORDER BY joined_count DESC');
}

/**
 * Join an event (with anti-rejoin protection)
 * @param {number} eventId - Event ID
 * @param {string} deviceIdentifier - Unique device identifier
 * @returns {Promise} - Resolves with join result
 */
async function joinEvent(eventId, deviceIdentifier) {
    // Check if already joined
    const existingJoin = await getRow(
        'SELECT * FROM event_joins WHERE event_id = ? AND device_identifier = ?',
        [eventId, deviceIdentifier]
    );

    if (existingJoin) {
        return { alreadyJoined: true, message: 'You have already joined this event!' };
    }

    // Add join record
    await runQuery(
        'INSERT INTO event_joins (event_id, device_identifier) VALUES (?, ?)',
        [eventId, deviceIdentifier]
    );

    // Increment join count on event
    await runQuery(
        'UPDATE events SET joined_count = joined_count + 1 WHERE id = ?',
        [eventId]
    );

    // Update global statistics
    await runQuery('UPDATE statistics SET stat_value = stat_value + 1, updated_at = CURRENT_TIMESTAMP WHERE stat_key = ?', ['total_joins']);

    return { alreadyJoined: false, message: 'Successfully joined the event!' };
}

/**
 * Check if a device has already joined an event
 * @param {number} eventId - Event ID
 * @param {string} deviceIdentifier - Device identifier
 * @returns {Promise} - Resolves with boolean
 */
async function hasJoinedEvent(eventId, deviceIdentifier) {
    const result = await getRow(
        'SELECT * FROM event_joins WHERE event_id = ? AND device_identifier = ?',
        [eventId, deviceIdentifier]
    );
    return !!result;
}

/**
 * Get platform statistics
 * @returns {Promise} - Resolves with statistics object
 */
async function getStatistics() {
    const stats = await getRows('SELECT * FROM statistics');
    const statsObj = {};
    stats.forEach(stat => {
        statsObj[stat.stat_key] = stat.stat_value;
    });

    // Also get real counts from database
    const eventCount = await getRow('SELECT COUNT(*) as count FROM events');
    const joinCount = await getRow('SELECT COUNT(*) as count FROM event_joins');

    statsObj.actual_event_count = eventCount.count;
    statsObj.actual_join_count = joinCount.count;

    return statsObj;
}

/**
 * Update an event's trending status
 * @param {number} eventId - Event ID
 * @param {boolean} trending - Trending status
 */
async function updateTrending(eventId, trending) {
    return await runQuery('UPDATE events SET trending = ? WHERE id = ?', [trending ? 1 : 0, eventId]);
}

/**
 * Delete an event
 * @param {number} id - Event ID
 */
async function deleteEvent(id) {
    await runQuery('DELETE FROM event_joins WHERE event_id = ?', [id]);
    return await runQuery('DELETE FROM events WHERE id = ?', [id]);
}

module.exports = {
    createEvent,
    getAllEvents,
    getEventById,
    getLatestEvents,
    getTrendingEvents,
    joinEvent,
    hasJoinedEvent,
    getStatistics,
    updateTrending,
    deleteEvent
};
