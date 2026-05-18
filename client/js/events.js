/**
 * Campus Event Tracker - Events Page JavaScript
 * Handles: Event listing, filtering, sorting, search, modal, join logic
 * 
 * JOIN FLOW: See event → Click Join → Confirmation modal → After confirm,
 * contact details (Google Form, WhatsApp, Social Link) are revealed
 */

// State
let allEvents = [];
let currentFilter = { category: 'All', sort: 'latest', search: '' };
let currentEventId = null;

// ============================================
// LOAD EVENTS
// ============================================
async function loadEvents() {
    const grid = document.getElementById('eventsGrid');
    const emptyState = document.getElementById('emptyState');
    
    try {
        const data = await apiCall(`/events?sort=${currentFilter.sort}&category=${currentFilter.category}&search=${encodeURIComponent(currentFilter.search)}`);
        
        if (data.success) {
            allEvents = data.data;
            renderEvents(allEvents);
            
            if (allEvents.length === 0) {
                grid.style.display = 'none';
                emptyState.style.display = 'block';
            } else {
                grid.style.display = 'grid';
                emptyState.style.display = 'none';
            }
        }
    } catch (err) {
        console.error('Failed to load events:', err);
        // Show fallback
        renderFallbackEvents();
    }
}

// ============================================
// RENDER EVENTS
// ============================================
function renderEvents(events) {
    const grid = document.getElementById('eventsGrid');
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
                    <button class="btn btn-primary btn-sm" style="flex:1; justify-content:center;" onclick="openEventModal(${event.id}); addRipple(event);">View Details</button>
                    ${joined ? 
                        '<button class="btn btn-secondary btn-sm" disabled style="flex:1; opacity:0.6;">✅ Already Joined</button>' : 
                        `<button class="btn btn-secondary btn-sm" style="flex:1; justify-content:center;" onclick="openJoinModal(${event.id}); addRipple(event);">⚡ Join Event</button>`
                    }
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Fallback events
function renderFallbackEvents() {
    const fallbackEvents = [
        { id: 1, event_name: 'TechVista 2025', category: 'Hackathon', description: 'A 24-hour national-level hackathon bringing together the brightest minds to build innovative solutions.', venue: 'Main Auditorium', last_date: '2025-08-15', fee: 200, joined_count: 156, trending: 1, organizer_name: 'ACM Student Chapter', contact: '+91 9876543210', email: 'techvista@campus.edu', mode: 'Offline', event_date: '2025-08-20', event_time: '09:00 AM', image_path: '/uploads/event1.jpg', google_form_link: 'https://forms.gle/techvista2025', whatsapp_link: 'https://chat.whatsapp.com/techvista', external_link: 'https://techvista.campus.edu', custom_instructions: 'Bring your laptop and charger. Teams of 2-4 members.', how_to_join: '1. Click "Join Event" and confirm\n2. Fill the Google Form with your team details\n3. Join the WhatsApp group for updates\n4. Carry your college ID on event day\n5. Arrive by 8:30 AM for check-in', rules: '1. Maximum 4 members per team\n2. Must be a current college student\n3. Original projects only' },
        { id: 2, event_name: 'Cultural Night Extravaganza', category: 'Cultural', description: 'An evening of music, dance, drama, and art celebrating the diverse cultural heritage of our campus.', venue: 'Open Air Theatre', last_date: '2025-07-10', fee: 0, joined_count: 243, trending: 1, organizer_name: 'Cultural Committee', contact: '+91 9876543211', email: 'cultural@campus.edu', mode: 'Offline', event_date: '2025-07-14', event_time: '06:00 PM', image_path: '/uploads/event2.jpg', google_form_link: 'https://forms.gle/culturalnight', whatsapp_link: 'https://chat.whatsapp.com/cultural', external_link: 'https://cultural.campus.edu', custom_instructions: 'Register your performance category during sign-up.', how_to_join: '1. Click "Join Event" and confirm\n2. Fill the registration form with your performance category\n3. Join the WhatsApp group for schedule updates\n4. Report to backstage 30 minutes before your slot\n5. Carry your own props and costumes', rules: '1. Solo and group categories available\n2. Time limit: 5 minutes per performance' },
        { id: 3, event_name: 'AI/ML Workshop Series', category: 'Workshop', description: 'A 3-day intensive workshop on Artificial Intelligence and Machine Learning covering neural networks, NLP, and computer vision.', venue: 'CS Lab 301', last_date: '2025-09-20', fee: 150, joined_count: 89, trending: 0, organizer_name: 'Department of CS', contact: '+91 9876543212', email: 'aiml@campus.edu', mode: 'Hybrid', event_date: '2025-09-25', event_time: '10:00 AM', image_path: '/uploads/event3.jpg', google_form_link: 'https://forms.gle/aimlworkshop', whatsapp_link: 'https://chat.whatsapp.com/aiml', external_link: 'https://aiml.campus.edu', custom_instructions: 'Laptop with Python 3.8+ installed required.', how_to_join: '1. Click "Join Event" and confirm\n2. Fill the Google form with your details\n3. Join the WhatsApp group for material links\n4. Install Python 3.8+, TensorFlow & PyTorch before Day 1\n5. Carry your laptop and charger daily', rules: '1. Limited to 100 seats\n2. Basic Python knowledge required' },
        { id: 4, event_name: 'Inter-College Basketball Tournament', category: 'Sports', description: 'Annual inter-college basketball tournament featuring 16 teams from across the state.', venue: 'Indoor Sports Complex', last_date: '2025-07-12', fee: 500, joined_count: 67, trending: 0, organizer_name: 'Sports Committee', contact: '+91 9876543213', email: 'sports@campus.edu', mode: 'Offline', event_date: '2025-07-18', event_time: '08:00 AM', image_path: '/uploads/event4.jpg', google_form_link: 'https://forms.gle/basketball', whatsapp_link: 'https://chat.whatsapp.com/basketball', external_link: 'https://sports.campus.edu', custom_instructions: 'Each team must have 7-12 players.', how_to_join: '1. Click "Join Event" and confirm\n2. Fill the Google form with your team roster\n3. Join the WhatsApp group for fixture updates\n4. Carry college ID and sports kit on all match days\n5. Report 30 minutes before your match time', rules: '1. Teams of 7-12 players\n2. College ID mandatory' },
        { id: 5, event_name: 'Startup Pitch Competition', category: 'Seminar', description: 'Present your startup idea to a panel of VCs and angel investors. Top 3 ideas receive seed funding.', venue: 'Seminar Hall', last_date: '2025-09-28', fee: 100, joined_count: 112, trending: 1, organizer_name: 'E-Cell', contact: '+91 9876543214', email: 'ecell@campus.edu', mode: 'Offline', event_date: '2025-10-05', event_time: '02:00 PM', image_path: '/uploads/event5.jpg', google_form_link: 'https://forms.gle/startuppitch', whatsapp_link: 'https://chat.whatsapp.com/startup', external_link: 'https://ecell.campus.edu', custom_instructions: 'Prepare a 10-minute pitch deck.', how_to_join: '1. Click "Join Event" and confirm\n2. Fill the Google form with your idea summary\n3. Join the WhatsApp group for mentor connect\n4. Prepare a 10-slide pitch deck (PPT/PDF)\n5. Arrive 15 minutes early for slot allocation', rules: '1. Maximum 3 team members\n2. Idea must be original' },
        { id: 6, event_name: 'Web Development Bootcamp', category: 'Technical', description: 'A comprehensive 2-day bootcamp covering modern web development with React, Node.js, and MongoDB.', venue: 'IT Lab 201', last_date: '2025-10-01', fee: 0, joined_count: 78, trending: 0, organizer_name: 'Google DSC', contact: '+91 9876543215', email: 'dsc@campus.edu', mode: 'Hybrid', event_date: '2025-10-08', event_time: '09:30 AM', image_path: '/uploads/event6.jpg', google_form_link: 'https://forms.gle/webdevbootcamp', whatsapp_link: 'https://chat.whatsapp.com/webdev', external_link: 'https://dsc.campus.edu', custom_instructions: 'Install VS Code, Node.js 18+, and Git.', how_to_join: '1. Click "Join Event" and confirm\n2. Fill the Google form with your skill level\n3. Join the WhatsApp group for pre-bootcamp resources\n4. Install VS Code, Node.js 18+, and Git beforehand\n5. Carry your laptop with full charge', rules: '1. Open to all branches\n2. Bring your own laptop' }
    ];
    allEvents = fallbackEvents;
    renderEvents(fallbackEvents);
}

// ============================================
// EVENT DETAIL MODAL
// Shows event details with "How to Join" section.
// Contact links are HIDDEN until user joins the event.
// ============================================
async function openEventModal(eventId) {
    currentEventId = eventId;
    const modal = document.getElementById('eventModal');
    const modalImage = document.getElementById('modalImage');
    const modalBody = document.getElementById('modalBody');

    try {
        const data = await apiCall(`/events/${eventId}`);
        if (data.success) {
            const event = data.data;
            const joined = hasLocalJoined(event.id);
            const days = daysUntil(event.last_date);
            const isTrending = event.trending === 1 || event.joined_count > 100;
            const hasImage = eventHasRealImage(event);

            if (hasImage) {
                modalImage.style.background = getEventImage(event);
            } else {
                modalImage.style.background = getEventImage(event);
            }
            modalImage.innerHTML = `
                ${isTrending ? '<span class="event-card-badge trending" style="top:16px; left:16px;">🔥 Trending</span>' : ''}
                <div style="position:absolute; bottom:16px; right:16px; display:flex; gap:8px;">
                    <button onclick="shareEvent(${JSON.stringify(event).replace(/"/g, '&quot;')})" style="width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;font-size:1rem;cursor:pointer;" title="Share">📤</button>
                    <button onclick="copyEventLink()" style="width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;font-size:1rem;cursor:pointer;" title="Copy Link">🔗</button>
                </div>
            `;

            const rulesHtml = event.rules ? `
                <div class="modal-rules">
                    <h4>📋 Event Rules</h4>
                    <ul>
                        ${event.rules.split('\n').map(rule => `<li>${rule.replace(/^\d+\.\s*/, '')}</li>`).join('')}
                    </ul>
                </div>
            ` : '';

            // How to Join section - always visible
            const howToJoinHtml = event.how_to_join ? `
                <div class="how-to-join-section">
                    <h4>📌 How to Join This Event</h4>
                    <ul>
                        ${event.how_to_join.split('\n').map(step => `<li>${step.replace(/^\d+\.\s*/, '')}</li>`).join('')}
                    </ul>
                </div>
            ` : '';

            // Contact links - ONLY shown if user has already joined
            const revealedLinksHtml = joined ? `
                <div class="revealed-contact-section">
                    <h4>📣 Organizer Contact Details</h4>
                    <div class="modal-links">
                        ${event.google_form_link ? `<a href="${event.google_form_link}" target="_blank">📝 Google Form</a>` : ''}
                        ${event.whatsapp_link ? `<a href="${event.whatsapp_link}" target="_blank">💬 WhatsApp Group</a>` : ''}
                        ${event.external_link ? `<a href="${event.external_link}" target="_blank">🌐 Social Link</a>` : ''}
                    </div>
                </div>
            ` : '';

            const countdownHtml = days !== null && days > 0 ? `
                <div class="countdown">
                    <div class="countdown-item">
                        <div class="count-value">${days}</div>
                        <div class="count-label">Days</div>
                    </div>
                    <div class="countdown-item">
                        <div class="count-value">${Math.floor((days * 24) % 24)}</div>
                        <div class="count-label">Hours</div>
                    </div>
                </div>
            ` : '';

            modalBody.innerHTML = `
                <span class="modal-category" style="background:${getCategoryColor(event.category)}; color:${getCategoryTextColor(event.category)};">
                    ${event.category}
                </span>
                <h2>${event.event_name}</h2>
                ${countdownHtml}
                <p class="modal-description">${event.description}</p>
                
                <div class="modal-detail-grid">
                    <div class="modal-detail-item">
                        <div class="detail-icon">📍</div>
                        <div>
                            <div class="detail-label">Venue</div>
                            <div class="detail-value">${event.venue}</div>
                        </div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="detail-icon">📅</div>
                        <div>
                            <div class="detail-label">Event Date</div>
                            <div class="detail-value">${formatDate(event.event_date)} at ${event.event_time}</div>
                        </div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="detail-icon">⏰</div>
                        <div>
                            <div class="detail-label">Last Registration</div>
                            <div class="detail-value">${formatDate(event.last_date)}</div>
                        </div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="detail-icon">💰</div>
                        <div>
                            <div class="detail-label">Joining Fee</div>
                            <div class="detail-value">${formatFee(event.fee)}</div>
                        </div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="detail-icon">👤</div>
                        <div>
                            <div class="detail-label">Organizer</div>
                            <div class="detail-value">${event.organizer_name}</div>
                        </div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="detail-icon">🌐</div>
                        <div>
                            <div class="detail-label">Mode</div>
                            <div class="detail-value">${event.mode}</div>
                        </div>
                    </div>
                </div>

                ${event.custom_instructions ? `
                    <div style="background:var(--bg-glass); border-radius:var(--radius-sm); padding:16px; margin:16px 0;">
                        <h4 style="font-size:0.9rem; margin-bottom:8px;">📌 Instructions</h4>
                        <p style="color:var(--text-secondary); font-size:0.85rem; line-height:1.6;">${event.custom_instructions}</p>
                    </div>
                ` : ''}

                ${howToJoinHtml}
                ${rulesHtml}
                ${revealedLinksHtml}

                <div class="modal-join-section">
                    <div class="join-count-display">
                        <span>👥</span>
                        <span>${event.joined_count} students joined</span>
                    </div>
                    ${joined ? 
                        '<button class="btn btn-secondary" disabled style="opacity:0.6;">✅ Already Joined</button>' : 
                        `<button class="btn btn-primary" onclick="openJoinModal(${event.id}); addRipple(event);">⚡ Join Event</button>`
                    }
                </div>
            `;

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    } catch (err) {
        console.error('Failed to load event details:', err);
        showToast('Failed to load event details', 'error');
    }
}

function closeEventModal() {
    const modal = document.getElementById('eventModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentEventId = null;
}

// ============================================
// JOIN EVENT - 3-Step Gated Flow
// Step 1: Click Join → Step 2: Confirm → Step 3: Contact details revealed
// ============================================
function openJoinModal(eventId) {
    currentEventId = eventId;
    const modal = document.getElementById('joinModal');
    const eventName = document.getElementById('joinEventName');
    const revealedSection = document.getElementById('revealedContactSection');

    // Hide revealed section initially
    if (revealedSection) {
        revealedSection.style.display = 'none';
        revealedSection.innerHTML = '';
    }

    // Reset confirm button
    const confirmBtn = document.getElementById('confirmJoinBtn');
    if (confirmBtn) {
        confirmBtn.style.display = '';
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Yes, Join!';
    }

    // Reset cancel button
    const cancelBtn = document.getElementById('cancelJoinBtn');
    if (cancelBtn) {
        cancelBtn.style.display = '';
    }

    // Show confirm popup content
    const confirmPopup = document.getElementById('confirmPopupContent');
    if (confirmPopup) {
        confirmPopup.style.display = '';
    }

    // Get event name
    const event = allEvents.find(e => e.id === eventId);
    if (event) {
        eventName.textContent = event.event_name;
    }

    modal.classList.add('active');
}

function closeJoinModal() {
    const modal = document.getElementById('joinModal');
    modal.classList.remove('active');
    currentEventId = null;
}

async function confirmJoin() {
    if (!currentEventId) return;

    const btn = document.getElementById('confirmJoinBtn');
    btn.disabled = true;
    btn.textContent = 'Joining...';

    try {
        const data = await apiCall(`/events/${currentEventId}/join`, {
            method: 'POST',
            body: JSON.stringify({ deviceId: DEVICE_ID })
        });

        if (data.success) {
            markLocalJoined(currentEventId);
            showToast(data.message, 'success');

            // Show the revealed contact details in the join modal
            if (data.contactDetails) {
                showRevealedContact(data.contactDetails, data.alreadyJoined);
            }

            // Refresh events list
            loadEvents();

            // Also refresh the event detail modal if open
            if (document.getElementById('eventModal').classList.contains('active')) {
                openEventModal(currentEventId);
            }
        } else {
            if (data.alreadyJoined && data.contactDetails) {
                // Already joined but show contact details anyway
                markLocalJoined(currentEventId);
                showRevealedContact(data.contactDetails, true);
                loadEvents();
            } else {
                showToast(data.message || 'Failed to join event', 'error');
            }
        }
    } catch (err) {
        console.error('Join error:', err);
        showToast('Failed to join event. Please try again.', 'error');
    }

    btn.disabled = false;
    btn.textContent = 'Yes, Join!';
}

/**
 * Show revealed contact details after successful join
 * Replaces the confirm popup with the contact details
 */
function showRevealedContact(contactDetails, alreadyJoined) {
    const confirmPopup = document.getElementById('confirmPopupContent');
    const revealedSection = document.getElementById('revealedContactSection');
    
    // Hide the confirm popup content
    if (confirmPopup) {
        confirmPopup.style.display = 'none';
    }

    if (!revealedSection) return;

    // Build the revealed contact HTML
    let html = `
        <div class="revealed-contact-inner">
            <div class="revealed-success-icon">✅</div>
            <h3>${alreadyJoined ? 'You\'re Already In!' : 'Successfully Joined!'}</h3>
            <p class="revealed-subtitle">Here are the organizer's contact details:</p>
    `;

    // Show how to join steps
    if (contactDetails.how_to_join) {
        html += `
            <div class="revealed-how-to-join">
                <h4>📌 Next Steps</h4>
                <ul>
                    ${contactDetails.how_to_join.split('\n').map(step => `<li>${step.replace(/^\d+\.\s*/, '')}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // Show contact links
    const hasLinks = contactDetails.google_form_link || contactDetails.whatsapp_link || contactDetails.external_link;
    if (hasLinks) {
        html += `<div class="revealed-links">`;
        if (contactDetails.google_form_link) {
            html += `<a href="${contactDetails.google_form_link}" target="_blank" class="revealed-link-btn">📝 Google Form</a>`;
        }
        if (contactDetails.whatsapp_link) {
            html += `<a href="${contactDetails.whatsapp_link}" target="_blank" class="revealed-link-btn">💬 WhatsApp Group</a>`;
        }
        if (contactDetails.external_link) {
            html += `<a href="${contactDetails.external_link}" target="_blank" class="revealed-link-btn">🌐 Social Link</a>`;
        }
        html += `</div>`;
    }

    html += `
            <button class="btn btn-primary revealed-ok-btn" onclick="closeJoinModal()">OK, Got it!</button>
        </div>
    `;

    revealedSection.style.display = 'block';
    revealedSection.innerHTML = html;
}

// ============================================
// FILTER & SEARCH
// ============================================
function setupFilters() {
    // Category pills
    document.querySelectorAll('.category-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter.category = pill.dataset.category;
            loadEvents();
        });
    });

    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentFilter.sort = sortSelect.value;
            loadEvents();
        });
    }

    // Search input (debounced)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentFilter.search = searchInput.value;
                loadEvents();
            }, 300);
        });
    }
}

// ============================================
// URL PARAMETER HANDLING
// ============================================
function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const viewId = params.get('view');
    const joinId = params.get('join');

    if (viewId) {
        setTimeout(() => openEventModal(parseInt(viewId)), 500);
    } else if (joinId) {
        setTimeout(() => openJoinModal(parseInt(joinId)), 500);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    setupFilters();
    handleUrlParams();

    // Modal close
    document.getElementById('modalClose').addEventListener('click', closeEventModal);
    document.getElementById('eventModal').addEventListener('click', (e) => {
        if (e.target.id === 'eventModal') closeEventModal();
    });

    // Confirm join
    document.getElementById('confirmJoinBtn').addEventListener('click', confirmJoin);

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeEventModal();
            closeJoinModal();
        }
    });
});

// Make functions globally available
window.openEventModal = openEventModal;
window.closeEventModal = closeEventModal;
window.openJoinModal = openJoinModal;
window.closeJoinModal = closeJoinModal;
window.confirmJoin = confirmJoin;
