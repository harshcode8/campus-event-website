/**
 * Campus Event Tracker - Main Application JavaScript
 * Handles: Navbar, theme toggle, scroll effects, toasts, cursor glow,
 * back-to-top, sidebar, and shared utility functions
 */

// ============================================
// DEVICE FINGERPRINT (Anti-Rejoin System)
// ============================================
function generateDeviceId() {
    // Check if we already have a stored device ID
    let deviceId = localStorage.getItem('cet_device_id');
    if (deviceId) return deviceId;

    // Generate a fingerprint from browser properties
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    const canvasData = canvas.toDataURL();

    const nav = navigator;
    const screen = window.screen;
    const raw = [
        nav.userAgent,
        nav.language,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        canvasData.slice(-50)
    ].join('||');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    deviceId = 'DEV_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
    localStorage.setItem('cet_device_id', deviceId);
    return deviceId;
}

// Get or generate device ID
const DEVICE_ID = generateDeviceId();

// Check if user has joined an event (localStorage backup)
function hasLocalJoined(eventId) {
    const joins = JSON.parse(localStorage.getItem('cet_joins') || '[]');
    return joins.includes(eventId);
}

// Mark event as joined locally
function markLocalJoined(eventId) {
    const joins = JSON.parse(localStorage.getItem('cet_joins') || '[]');
    if (!joins.includes(eventId)) {
        joins.push(eventId);
        localStorage.setItem('cet_joins', JSON.stringify(joins));
    }
}

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// ============================================
// NAVBAR - Scroll effect & active state
// ============================================
const navbar = document.getElementById('navbar');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    
    // Add scrolled class to navbar
    if (navbar && !navbar.classList.contains('scrolled')) {
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        }
    }

    // Scroll progress bar
    const scrollProgress = document.getElementById('scrollProgress');
    if (scrollProgress) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollY / docHeight) * 100;
        scrollProgress.style.width = progress + '%';
    }

    // Back to top button
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        if (scrollY > 400) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }

    lastScrollY = scrollY;
});

// Back to top click
const backToTop = document.getElementById('backToTop');
if (backToTop) {
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============================================
// MOBILE SIDEBAR
// ============================================
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('mobileSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

if (hamburger && sidebar && sidebarOverlay) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    });

    sidebarOverlay.addEventListener('click', () => {
        hamburger.classList.remove('active');
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    });

    // Close sidebar on link click
    sidebar.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    });
}

// ============================================
// THEME TOGGLE (Dark/Light Mode)
// ============================================
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('cet_theme') || 'dark';

// Apply saved theme
document.documentElement.setAttribute('data-theme', savedTheme);
if (themeToggle) {
    themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
        localStorage.setItem('cet_theme', newTheme);
        showToast(`Switched to ${newTheme} mode`, 'info', 2000);
    });
}

// ============================================
// CURSOR GLOW EFFECT
// ============================================
const cursorGlow = document.getElementById('cursorGlow');
if (cursorGlow) {
    document.addEventListener('mousemove', (e) => {
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
    });
}

// ============================================
// SCROLL REVEAL ANIMATIONS
// ============================================
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    reveals.forEach(el => observer.observe(el));
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initScrollReveal);

// ============================================
// BUTTON RIPPLE EFFECT
// ============================================
function addRipple(event) {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

// ============================================
// FAQ ACCORDION
// ============================================
document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const isActive = item.classList.contains('active');
        
        // Close all
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
        
        // Toggle current
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// ============================================
// UTILITY: Format date
// ============================================
function formatDate(dateStr) {
    if (!dateStr) return 'TBD';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    } catch (e) {
        return dateStr;
    }
}

// ============================================
// UTILITY: Format fee
// ============================================
function formatFee(fee) {
    if (fee === 0 || fee === '0') return 'Free';
    return '₹' + fee;
}

// ============================================
// UTILITY: Days until date
// ============================================
function daysUntil(dateStr) {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const now = new Date();
    const diff = target - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ============================================
// UTILITY: Event image handling
// Uses actual image_path from database when available,
// falls back to CSS gradient if image is missing
// ============================================
function getEventImage(event) {
    // Check if event has a valid image path
    if (event.image_path && event.image_path !== '/uploads/default-event.jpg') {
        // Return the image URL - works both locally and in production
        // since Express serves /uploads as static
        return `url('${event.image_path}') center/cover no-repeat`;
    }
    
    // Fallback to gradient backgrounds
    const gradients = [
        'linear-gradient(135deg, #7c3aed, #06b6d4)',
        'linear-gradient(135deg, #ec4899, #8b5cf6)',
        'linear-gradient(135deg, #06b6d4, #3b82f6)',
        'linear-gradient(135deg, #f59e0b, #ef4444)',
        'linear-gradient(135deg, #10b981, #3b82f6)',
        'linear-gradient(135deg, #8b5cf6, #ec4899)',
        'linear-gradient(135deg, #3b82f6, #06b6d4)',
        'linear-gradient(135deg, #ef4444, #f59e0b)'
    ];
    const idx = (event.id || 0) % gradients.length;
    return gradients[idx];
}

/**
 * Check if an event has a real image (not just a gradient)
 * Used to determine rendering approach
 */
function eventHasRealImage(event) {
    return event.image_path && event.image_path !== '/uploads/default-event.jpg';
}

// ============================================
// UTILITY: Category color
// ============================================
function getCategoryColor(category) {
    const colors = {
        'Hackathon': 'rgba(124,58,237,0.15)',
        'Workshop': 'rgba(6,182,212,0.15)',
        'Cultural': 'rgba(236,72,153,0.15)',
        'Sports': 'rgba(16,185,129,0.15)',
        'Seminar': 'rgba(245,158,11,0.15)',
        'Technical': 'rgba(59,130,246,0.15)'
    };
    return colors[category] || 'rgba(124,58,237,0.15)';
}

function getCategoryTextColor(category) {
    const colors = {
        'Hackathon': '#a78bfa',
        'Workshop': '#67e8f9',
        'Cultural': '#f472b6',
        'Sports': '#6ee7b7',
        'Seminar': '#fcd34d',
        'Technical': '#93c5fd'
    };
    return colors[category] || '#a78bfa';
}

// ============================================
// HERO PARTICLES (Home page)
// ============================================
function createHeroParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'hero-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (4 + Math.random() * 4) + 's';
        particle.style.opacity = Math.random() * 0.5 + 0.1;
        particle.style.width = (2 + Math.random() * 4) + 'px';
        particle.style.height = particle.style.width;
        container.appendChild(particle);
    }
}

document.addEventListener('DOMContentLoaded', createHeroParticles);

// ============================================
// API HELPER
// ============================================
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`/api${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, message: 'Network error. Please check if the server is running.' };
    }
}

// ============================================
// SHARE & COPY LINK
// ============================================
function shareEvent(event) {
    if (navigator.share) {
        navigator.share({
            title: event.event_name,
            text: `Check out ${event.event_name} on Campus Event Tracker!`,
            url: window.location.origin + '/events'
        }).catch(() => {});
    } else {
        // Fallback: copy link
        copyEventLink();
    }
}

function copyEventLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!', 'success', 2000);
    }).catch(() => {
        showToast('Could not copy link', 'error', 2000);
    });
}

// Make functions globally available
window.showToast = showToast;
window.addRipple = addRipple;
window.DEVICE_ID = DEVICE_ID;
window.hasLocalJoined = hasLocalJoined;
window.markLocalJoined = markLocalJoined;
window.formatDate = formatDate;
window.formatFee = formatFee;
window.daysUntil = daysUntil;
window.getEventImage = getEventImage;
window.eventHasRealImage = eventHasRealImage;
window.getCategoryColor = getCategoryColor;
window.getCategoryTextColor = getCategoryTextColor;
window.apiCall = apiCall;
window.shareEvent = shareEvent;
window.copyEventLink = copyEventLink;
