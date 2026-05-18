/**
 * Campus Event Tracker - Home Page JavaScript
 * Handles: Animated counters, latest events, statistics
 */

// ============================================
// ANIMATED COUNTER
// ============================================
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const isDecimal = target % 1 !== 0;

    function update() {
        start += increment;
        if (start >= target) {
            element.textContent = isDecimal ? target.toFixed(1) : Math.floor(target).toLocaleString();
            return;
        }
        element.textContent = isDecimal ? start.toFixed(1) : Math.floor(start).toLocaleString();
        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// ============================================
// LOAD STATISTICS FROM API
// ============================================
async function loadStatistics() {
    try {
        const data = await apiCall('/statistics');
        if (data.success) {
            const stats = data.data;

            // Animate counters
            const liveEvents = document.getElementById('statLiveEvents');
            const totalEvents = document.getElementById('statTotalEvents');
            const totalJoins = document.getElementById('statTotalJoins');

            if (liveEvents) animateCounter(liveEvents, stats.live_events || stats.actual_event_count || 8);
            if (totalEvents) animateCounter(totalEvents, stats.total_events || stats.actual_event_count || 8);
            if (totalJoins) animateCounter(totalJoins, stats.total_joins || stats.actual_join_count || 924);
        }
    } catch (err) {
        console.error('Failed to load statistics:', err);
        // Fallback values
        const liveEvents = document.getElementById('statLiveEvents');
        const totalEvents = document.getElementById('statTotalEvents');
        const totalJoins = document.getElementById('statTotalJoins');
        if (liveEvents) animateCounter(liveEvents, 8);
        if (totalEvents) animateCounter(totalEvents, 8);
        if (totalJoins) animateCounter(totalJoins, 924);
    }
}

// ============================================
// LATEST EVENTS - Load and Render
// ============================================
async function loadLatestEvents() {
    const grid = document.getElementById('latestEventsGrid');
    if (!grid) return;

    try {
        const data = await apiCall('/events/latest?limit=3');
        if (data.success && data.data.length > 0) {
            renderLatestEvents(data.data);
        } else {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <div class="empty-icon">📅</div>
                    <h3>No Events Yet</h3>
                    <p>Be the first to host an event on the platform!</p>
                </div>
            `;
        }
    } catch (err) {
        console.error('Failed to load latest events:', err);
        // Show fallback
        renderFallbackEvents();
    }
}

function renderLatestEvents(events) {
    const grid = document.getElementById('latestEventsGrid');
    if (!grid) return;

    grid.innerHTML = events.map(event => {
        const joined = hasLocalJoined(event.id);
        const days = daysUntil(event.last_date);
        const isTrending = event.trending === 1 || event.joined_count > 100;
        const popularityPercent = Math.min(100, Math.round((event.joined_count / 250) * 100));
        const hasImage = eventHasRealImage(event);
        const bgStyle = hasImage ? `background:${getEventImage(event)}` : `background:${getEventImage(event)}`;

        return `
        <div class="event-card reveal active">
            <div class="event-card-image" style="${bgStyle}; position:relative;">
                ${isTrending ? '<span class="event-card-badge trending">🔥 Trending</span>' : 
                    days !== null && days <= 3 ? '<span class="event-card-badge" style="background:rgba(239,68,68,0.9);">⏰ Closing Soon</span>' : ''}
                <div style="position:absolute; bottom:12px; right:12px; display:flex; gap:6px;">
                    <button onclick="shareEvent(${JSON.stringify(event).replace(/"/g, '&quot;')})" style="width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;font-size:0.8rem;cursor:pointer;" title="Share">📤</button>
                </div>
            </div>
            <div class="event-card-body">
                <span class="event-card-category" style="background:${getCategoryColor(event.category)}; color:${getCategoryTextColor(event.category)};">
                    ${event.category}
                </span>
                <h3 class="event-card-title">${event.event_name}</h3>
                <p class="event-card-desc">${event.description}</p>
                <div class="event-card-meta">
                    <span>📍 ${event.venue}</span>
                    <span>📅 ${formatDate(event.last_date)}</span>
                    <span>💰 ${formatFee(event.fee)}</span>
                </div>
                <div class="popularity-meter">
                    <div class="popularity-bar">
                        <div class="popularity-fill" style="width:${popularityPercent}%"></div>
                    </div>
                    <span class="popularity-label">${popularityPercent}%</span>
                </div>
                <div class="event-card-footer">
                    <span class="event-fee">${formatFee(event.fee)}</span>
                    <span class="event-joined">👥 ${event.joined_count} joined</span>
                </div>
                ${event.how_to_join ? `
                <div class="how-to-join-card">
                    <h4>📌 How to Join</h4>
                    <ul>${event.how_to_join.split('\n').map(step => `<li>${step.replace(/^\d+\.\s*/, '')}</li>`).join('')}</ul>
                </div>
                ` : ''}
                <div class="event-card-actions">
                    <a href="/events?view=${event.id}" class="btn btn-primary btn-sm" style="flex:1; justify-content:center;" onclick="addRipple(event)">View Details</a>
                    ${joined ? 
                        '<button class="btn btn-secondary btn-sm" disabled style="flex:1; opacity:0.6;">✅ Already Joined</button>' : 
                        `<a href="/events?join=${event.id}" class="btn btn-secondary btn-sm" style="flex:1; justify-content:center;" onclick="addRipple(event)">⚡ Join Event</a>`
                    }
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Fallback events if API is not available
function renderFallbackEvents() {
    const fallbackEvents = [
        { id: 1, event_name: 'TechVista 2025', category: 'Hackathon', description: 'A 24-hour national-level hackathon bringing together the brightest minds to build innovative solutions.', venue: 'Main Auditorium', last_date: '2025-08-15', fee: 200, joined_count: 156, trending: 1, image_path: '/uploads/event1.jpg', how_to_join: '1. Click "Join Event" and confirm\n2. Fill the Google Form with your team details\n3. Join the WhatsApp group for updates\n4. Carry your college ID on event day\n5. Arrive by 8:30 AM for check-in' },
        { id: 2, event_name: 'Cultural Night Extravaganza', category: 'Cultural', description: 'An evening of music, dance, drama, and art celebrating the diverse cultural heritage.', venue: 'Open Air Theatre', last_date: '2025-07-10', fee: 0, joined_count: 243, trending: 1, image_path: '/uploads/event2.jpg', how_to_join: '1. Click "Join Event" and confirm\n2. Fill the registration form with your performance category\n3. Join the WhatsApp group for schedule updates\n4. Report to backstage 30 minutes before your slot\n5. Carry your own props and costumes' },
        { id: 3, event_name: 'AI/ML Workshop Series', category: 'Workshop', description: 'A 3-day intensive workshop on Artificial Intelligence and Machine Learning.', venue: 'CS Lab 301', last_date: '2025-09-20', fee: 150, joined_count: 89, trending: 0, image_path: '/uploads/event3.jpg', how_to_join: '1. Click "Join Event" and confirm\n2. Fill the Google form with your details\n3. Join the WhatsApp group for material links\n4. Install Python 3.8+, TensorFlow & PyTorch before Day 1\n5. Carry your laptop and charger daily' }
    ];
    renderLatestEvents(fallbackEvents);
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadStatistics();
    loadLatestEvents();
});
