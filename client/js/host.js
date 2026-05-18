/**
 * Campus Event Tracker - Host Event Page JavaScript
 * Handles: Form validation, image upload, event creation
 */

// ============================================
// IMAGE UPLOAD HANDLING
// ============================================
const bannerUpload = document.getElementById('bannerUpload');
const bannerInput = document.querySelector('input[name="banner"]');
const bannerPreview = document.getElementById('bannerPreview');

if (bannerUpload && bannerInput) {
    // Click to upload
    bannerUpload.addEventListener('click', () => bannerInput.click());

    // Drag & drop
    bannerUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        bannerUpload.classList.add('dragover');
    });

    bannerUpload.addEventListener('dragleave', () => {
        bannerUpload.classList.remove('dragover');
    });

    bannerUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        bannerUpload.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            bannerInput.files = e.dataTransfer.files;
            previewBanner(e.dataTransfer.files[0]);
        }
    });

    // File input change
    bannerInput.addEventListener('change', () => {
        if (bannerInput.files.length > 0) {
            previewBanner(bannerInput.files[0]);
        }
    });
}

function previewBanner(file) {
    if (!file || !file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be less than 5MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        bannerPreview.innerHTML = `
            <div class="image-preview-item">
                <img src="${e.target.result}" alt="Banner preview">
                <button type="button" class="remove-img" onclick="removeBanner()">✕</button>
            </div>
        `;
        bannerUpload.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function removeBanner() {
    if (bannerInput) bannerInput.value = '';
    if (bannerPreview) bannerPreview.innerHTML = '';
    if (bannerUpload) bannerUpload.style.display = '';
}

// ============================================
// FORM VALIDATION
// ============================================
function validateForm() {
    let isValid = true;
    const form = document.getElementById('hostEventForm');
    const requiredFields = form.querySelectorAll('[required]');

    requiredFields.forEach(field => {
        const group = field.closest('.form-group');
        if (!group) return;

        // Remove existing error
        group.classList.remove('error');

        // Check empty
        if (!field.value.trim()) {
            group.classList.add('error');
            isValid = false;
        }

        // Check email format
        if (field.type === 'email' && field.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                group.classList.add('error');
                isValid = false;
            }
        }
    });

    return isValid;
}

// ============================================
// FORM SUBMISSION
// ============================================
const hostForm = document.getElementById('hostEventForm');

if (hostForm) {
    hostForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Please fill in all required fields correctly', 'error');
            // Scroll to first error
            const firstError = hostForm.querySelector('.form-group.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        const submitBtn = hostForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Creating Event...';

        try {
            const formData = new FormData(hostForm);

            const response = await fetch('/api/events', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                showToast('🎉 Event created successfully! It will appear on the Events page.', 'success', 5000);
                
                // Show success state
                submitBtn.innerHTML = '✅ Event Created!';
                submitBtn.classList.remove('btn-primary');
                submitBtn.classList.add('btn-success');

                // Reset form after delay
                setTimeout(() => {
                    hostForm.reset();
                    removeBanner();
                    submitBtn.innerHTML = originalText;
                    submitBtn.classList.remove('btn-success');
                    submitBtn.classList.add('btn-primary');
                    submitBtn.disabled = false;

                    // Scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 3000);
            } else {
                showToast(data.message || 'Failed to create event', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } catch (err) {
            console.error('Form submission error:', err);
            showToast('Failed to create event. Please check if the server is running.', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // Real-time validation
    hostForm.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(field => {
        field.addEventListener('input', () => {
            const group = field.closest('.form-group');
            if (group) group.classList.remove('error');
        });
    });
}

// Make functions globally available
window.removeBanner = removeBanner;