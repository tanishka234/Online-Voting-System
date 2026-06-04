// Complete Voting System JavaScript Code
// Main Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initImageSlider();
    initDarkMode();
    initDevelopersSlider();
    initVotingSystem();
    initLocationDetection();
    updateRealTimeStats();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize other components
    initSmoothScrolling();
    initFormValidation();
});

// ======================
// IMAGE SLIDER COMPONENT
// ======================
function initImageSlider() {
    const slider = document.querySelector('.slider');
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev-slide');
    const nextBtn = document.querySelector('.next-slide');
    const dotsContainer = document.querySelector('.slider-dots');
    let currentSlide = 0;
    let slideInterval;

    if (!slider || !slides.length) return;

    // Create dots if container exists
    if (dotsContainer && slides.length > 1) {
        slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('slider-dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });
    }

    function updateSlider() {
        slider.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Update active dot
        const dots = document.querySelectorAll('.slider-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        updateSlider();
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateSlider();
    }

    function goToSlide(index) {
        currentSlide = index;
        updateSlider();
        resetAutoSlide();
    }

    function startAutoSlide() {
        slideInterval = setInterval(nextSlide, 5000);
    }

    function resetAutoSlide() {
        clearInterval(slideInterval);
        startAutoSlide();
    }

    // Event Listeners
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            resetAutoSlide();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            resetAutoSlide();
        });
    }

    // Pause on hover
    slider.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });
    
    slider.addEventListener('mouseleave', () => {
        startAutoSlide();
    });

    // Touch support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    slider.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        clearInterval(slideInterval);
    }, { passive: true });
    
    slider.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoSlide();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        const difference = touchStartX - touchEndX;
        
        if (Math.abs(difference) > swipeThreshold) {
            if (difference > 0) {
                // Swipe left - next slide
                nextSlide();
            } else {
                // Swipe right - previous slide
                prevSlide();
            }
        }
    }

    // Start auto-slide
    startAutoSlide();
}

// ======================
// DARK MODE COMPONENT
// ======================
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = localStorage.getItem('theme') || 
                        (prefersDarkScheme.matches ? 'dark' : 'light');

    // Set initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (darkModeToggle) {
        darkModeToggle.checked = currentTheme === 'dark';
    }

    // Toggle dark mode
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            const theme = this.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            
            // Dispatch custom event for theme change
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
        });
    }

    // Listen for system theme changes
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            const theme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            if (darkModeToggle) {
                darkModeToggle.checked = theme === 'dark';
            }
        }
    });
}

// ======================
// DEVELOPERS SLIDER COMPONENT
// ======================
function initDevelopersSlider() {
    const devTrack = document.querySelector('.developers-track');
    const devPrevBtn = document.querySelector('.dev-prev-btn');
    const devNextBtn = document.querySelector('.dev-next-btn');
    const devCards = document.querySelectorAll('.developer-card');
    
    if (!devTrack || !devCards.length) return;
    
    const cardWidth = devCards[0].offsetWidth + 40; // width + gap
    const visibleCards = 6;
    let isPaused = false;
    let currentPosition = 0;
    
    // Check if buttons exist before adding event listeners
    if (devPrevBtn && devNextBtn) {
        // Manual slider controls
        devPrevBtn.addEventListener('click', () => {
            if (!isPaused) {
                devTrack.style.animationPlayState = 'paused';
                isPaused = true;
            }
            
            currentPosition += cardWidth;
            if (currentPosition > 0) {
                currentPosition = -(cardWidth * (devCards.length - visibleCards));
            }
            
            devTrack.style.transform = `translateX(${currentPosition}px)`;
            updateSliderButtons();
        });
        
        devNextBtn.addEventListener('click', () => {
            if (!isPaused) {
                devTrack.style.animationPlayState = 'paused';
                isPaused = true;
            }
            
            currentPosition -= cardWidth;
            if (currentPosition < -(cardWidth * (devCards.length - visibleCards))) {
                currentPosition = 0;
            }
            
            devTrack.style.transform = `translateX(${currentPosition}px)`;
            updateSliderButtons();
        });

        function updateSliderButtons() {
            // Disable/enable buttons based on position
            devPrevBtn.disabled = currentPosition >= 0;
            devNextBtn.disabled = currentPosition <= -(cardWidth * (devCards.length - visibleCards));
        }
        
        // Pause auto-scroll on hover
        const devScroll = document.querySelector('.developers-scroll');
        
        if (devScroll) {
            devScroll.addEventListener('mouseenter', () => {
                devTrack.style.animationPlayState = 'paused';
                isPaused = true;
            });
            
            devScroll.addEventListener('mouseleave', () => {
                if (!devTrack.style.transform || devTrack.style.transform === 'translateX(0px)') {
                    devTrack.style.animationPlayState = 'running';
                    isPaused = false;
                }
            });
            
            // Touch support for mobile
            let touchStartX = 0;
            let touchEndX = 0;
            
            devScroll.addEventListener('touchstart', e => {
                touchStartX = e.changedTouches[0].screenX;
                devTrack.style.animationPlayState = 'paused';
                isPaused = true;
            }, { passive: true });
            
            devScroll.addEventListener('touchend', e => {
                touchEndX = e.changedTouches[0].screenX;
                handleDevSwipe();
            }, { passive: true });
            
            function handleDevSwipe() {
                const swipeThreshold = 50;
                const difference = touchStartX - touchEndX;
                
                if (Math.abs(difference) > swipeThreshold) {
                    if (difference > 0) {
                        // Swipe left - go to next
                        currentPosition -= cardWidth;
                        if (currentPosition < -(cardWidth * (devCards.length - visibleCards))) {
                            currentPosition = 0;
                        }
                    } else {
                        // Swipe right - go to previous
                        currentPosition += cardWidth;
                        if (currentPosition > 0) {
                            currentPosition = -(cardWidth * (devCards.length - visibleCards));
                        }
                    }
                    
                    devTrack.style.transform = `translateX(${currentPosition}px)`;
                    updateSliderButtons();
                }
            }
        }
        
        // Reset animation when it ends (seamless loop)
        devTrack.addEventListener('animationiteration', () => {
            currentPosition = 0;
            devTrack.style.transform = 'translateX(0)';
            updateSliderButtons();
        });

        // Initial button state
        updateSliderButtons();
    }
}

// ======================
// SIDE DRAWER FUNCTIONS
// ======================
function openDrawer() {
    const drawer = document.getElementById('sideDrawer');
    const overlay = document.querySelector('.drawer-overlay');
    if (drawer && overlay) {
        drawer.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Add escape key listener
        document.addEventListener('keydown', handleEscapeKey);
    }
}

function closeDrawer() {
    const drawer = document.getElementById('sideDrawer');
    const overlay = document.querySelector('.drawer-overlay');
    if (drawer && overlay) {
        drawer.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Remove escape key listener
        document.removeEventListener('keydown', handleEscapeKey);
    }
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeDrawer();
    }
}

// ======================
// VOTING SYSTEM COMPONENT
// ======================
function initVotingSystem() {
    const candidateOptions = document.querySelectorAll('.candidate-option');
    const voteForm = document.querySelector('.vote-form');
    
    // Load previously selected candidate
    const selectedCandidate = localStorage.getItem('selectedCandidate');
    if (selectedCandidate) {
        const prevSelected = document.querySelector(`.candidate-option[data-candidate-id="${selectedCandidate}"]`);
        if (prevSelected) {
            prevSelected.classList.add('selected');
        }
    }
    
    // Candidate selection
    candidateOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            candidateOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Store selected candidate
            const candidateId = this.dataset.candidateId;
            const candidateName = this.querySelector('.candidate-name')?.textContent || 'Unknown Candidate';
            const partyName = this.querySelector('.party-name')?.textContent || 'Independent';
            
            localStorage.setItem('selectedCandidate', candidateId);
            localStorage.setItem('selectedCandidateName', candidateName);
            localStorage.setItem('selectedCandidateParty', partyName);
            
            // Enable submit button if form exists
            const submitBtn = document.getElementById('submitVoteBtn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('disabled');
            }
        });
    });
    
    // Form submission
    if (voteForm) {
        voteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitVote();
        });
    }
}

// ======================
// LOCATION DETECTION
// ======================
function initLocationDetection() {
    const locationBtn = document.getElementById('getLocationBtn');
    
    if (locationBtn) {
        locationBtn.addEventListener('click', getLocation);
    }
}

function getLocation() {
    const locationField = document.getElementById('location') || document.getElementById('voteLocation');
    
    if (!locationField) return;
    
    // Show loading state
    const originalText = locationBtn.textContent;
    locationBtn.textContent = 'Detecting...';
    locationBtn.disabled = true;
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
                    const data = await response.json();
                    
                    if (data.address) {
                        const city = data.address.city || data.address.town || data.address.village || '';
                        const state = data.address.state || '';
                        const country = data.address.country || '';
                        const location = `${city}${city && state ? ', ' : ''}${state}${(city || state) && country ? ', ' : ''}${country}`;
                        locationField.value = location.trim();
                        
                        // Store location in localStorage
                        localStorage.setItem('userLocation', locationField.value);
                        localStorage.setItem('userCoordinates', JSON.stringify({
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        }));
                    }
                } catch (error) {
                    console.error('Geocoding error:', error);
                    locationField.value = `Latitude: ${position.coords.latitude.toFixed(4)}, Longitude: ${position.coords.longitude.toFixed(4)}`;
                } finally {
                    // Reset button
                    locationBtn.textContent = originalText;
                    locationBtn.disabled = false;
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                
                let errorMessage = 'Unable to get location. Please enter manually.';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied. Please enable location services.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.';
                        break;
                }
                
                alert(errorMessage);
                
                // Reset button
                locationBtn.textContent = originalText;
                locationBtn.disabled = false;
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        alert('Geolocation is not supported by your browser. Please enter location manually.');
        locationBtn.textContent = originalText;
        locationBtn.disabled = false;
    }
}

// ======================
// REAL-TIME STATISTICS
// ======================
async function updateRealTimeStats() {
    try {
        const response = await fetch('/api/vote_counts');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        // Update vote counts on the page
        const statsElement = document.getElementById('voteStats');
        if (statsElement) {
            let html = '<div class="stats-container">';
            html += '<h4><i class="fas fa-chart-line"></i> Live Vote Counts</h4>';
            html += '<div class="stats-grid">';
            
            data.forEach(candidate => {
                const percentage = candidate.total_votes > 0 
                    ? Math.round((candidate.votes / candidate.total_votes) * 100) 
                    : 0;
                
                html += `
                    <div class="stat-item">
                        <div class="stat-candidate">${candidate.candidate} (${candidate.party})</div>
                        <div class="stat-bar-container">
                            <div class="stat-bar" style="width: ${percentage}%"></div>
                        </div>
                        <div class="stat-numbers">
                            <span class="stat-votes">${candidate.votes.toLocaleString()} votes</span>
                            <span class="stat-percentage">${percentage}%</span>
                        </div>
                    </div>
                `;
            });
            
            html += '</div></div>';
            statsElement.innerHTML = html;
        }
        
        // Update total votes counter if exists
        const totalVotesElement = document.getElementById('totalVotes');
        if (totalVotesElement && data.length > 0) {
            const totalVotes = data.reduce((sum, candidate) => sum + candidate.votes, 0);
            totalVotesElement.textContent = totalVotes.toLocaleString();
        }
        
    } catch (error) {
        console.error('Error fetching vote counts:', error);
        // Display offline message
        const statsElement = document.getElementById('voteStats');
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="offline-stats">
                    <h4>Live Vote Counts</h4>
                    <p class="offline-message">
                        <i class="fas fa-wifi-slash"></i>
                        Unable to fetch live data. Please check your connection.
                    </p>
                </div>
            `;
        }
    }
}

// ======================
// SETUP EVENT LISTENERS
// ======================
function setupEventListeners() {
    // Profile button
    const profileBtn = document.querySelector('.profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', openDrawer);
    }
    
    // Close drawer button
    const closeDrawerBtn = document.querySelector('.close-drawer');
    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener('click', closeDrawer);
    }
    
    // Drawer overlay
    const drawerOverlay = document.querySelector('.drawer-overlay');
    if (drawerOverlay) {
        drawerOverlay.addEventListener('click', closeDrawer);
    }
    
    // Drawer navigation links
    const drawerLinks = document.querySelectorAll('.drawer-nav a');
    drawerLinks.forEach(link => {
        link.addEventListener('click', closeDrawer);
    });
    
    // Submit vote button
    const submitVoteBtn = document.getElementById('submitVoteBtn');
    if (submitVoteBtn) {
        submitVoteBtn.addEventListener('click', submitVote);
        
        // Initial state check
        const selectedCandidate = localStorage.getItem('selectedCandidate');
        if (!selectedCandidate) {
            submitVoteBtn.disabled = true;
            submitVoteBtn.classList.add('disabled');
        }
    }
    
    // Auto-refresh vote counts every 30 seconds
    setInterval(updateRealTimeStats, 30000);
    
    // Load saved location on page load
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
        const locationField = document.getElementById('location') || document.getElementById('voteLocation');
        if (locationField) {
            locationField.value = savedLocation;
        }
    }
    
    // Window resize handlers
    window.addEventListener('resize', debounce(() => {
        // Reinitialize sliders on resize
        initDevelopersSlider();
    }, 250));
}

// ======================
// SUBMIT VOTE FUNCTION
// ======================
async function submitVote() {
    const selectedCandidate = localStorage.getItem('selectedCandidate');
    const selectedCandidateName = localStorage.getItem('selectedCandidateName') || 'Unknown Candidate';
    const selectedCandidateParty = localStorage.getItem('selectedCandidateParty') || 'Independent';
    const locationField = document.getElementById('voteLocation');
    const location = locationField ? locationField.value.trim() : 'Unknown';
    
    if (!selectedCandidate) {
        showAlert('Please select a candidate before submitting your vote!', 'error');
        return;
    }
    
    if (locationField && locationField.required && !location) {
        showAlert('Please enter your location or use the detect location button.', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = document.getElementById('submitVoteBtn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    // Confirm vote
    const isConfirmed = confirm(`You are about to vote for:\n\n${selectedCandidateName}\n${selectedCandidateParty}\n\nThis action cannot be undone. Confirm your vote?`);
    
    if (!isConfirmed) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
    }
    
    try {
        const response = await fetch('/submit_vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                candidate_id: selectedCandidate,
                candidate_name: selectedCandidateName,
                candidate_party: selectedCandidateParty,
                location: location,
                timestamp: new Date().toISOString()
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show success message
            showAlert('✅ Vote submitted successfully! Thank you for voting.', 'success');
            
            // Store vote receipt
            localStorage.setItem('lastVoteReceipt', JSON.stringify({
                candidate: selectedCandidateName,
                party: selectedCandidateParty,
                location: location,
                timestamp: new Date().toISOString(),
                confirmationId: result.confirmation_id || Math.random().toString(36).substr(2, 9).toUpperCase()
            }));
            
            // Clear selected candidate
            localStorage.removeItem('selectedCandidate');
            localStorage.removeItem('selectedCandidateName');
            localStorage.removeItem('selectedCandidateParty');
            
            // Reset UI
            document.querySelectorAll('.candidate-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Update stats immediately
            updateRealTimeStats();
            
            // Redirect to receipt page
            setTimeout(() => {
                window.location.href = result.redirect || '/receipt.html';
            }, 3000);
        } else {
            showAlert(result.message || 'Error submitting vote. Please try again.', 'error');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error submitting vote:', error);
        showAlert('Network error! Please check your connection and try again.', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ======================
// ALERT SYSTEM
// ======================
function showAlert(message, type = 'info', duration = 5000) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.custom-alert');
    existingAlerts.forEach(alert => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    });
    
    // Create new alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert alert-${type}`;
    
    // Icons based on type
    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ⓘ'
    };
    
    alertDiv.innerHTML = `
        <span class="alert-icon">${icons[type] || icons.info}</span>
        <span class="alert-message">${message}</span>
        <button class="alert-close">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(alertDiv);
    
    // Force reflow
    alertDiv.offsetHeight;
    
    // Show alert
    alertDiv.classList.add('show');
    
    // Close button
    const closeBtn = alertDiv.querySelector('.alert-close');
    closeBtn.addEventListener('click', () => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 300);
    });
    
    // Auto remove
    if (duration > 0) {
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.classList.remove('show');
                setTimeout(() => alertDiv.remove(), 300);
            }
        }, duration);
    }
    
    return alertDiv;
}

// ======================
// QR CODE GENERATION
// ======================
function generateQRCode(text, elementId, options = {}) {
    if (typeof QRCode === 'undefined') {
        console.warn('QRCode library not loaded');
        return null;
    }
    
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id "${elementId}" not found`);
        return null;
    }
    
    // Clear existing QR code
    element.innerHTML = '';
    
    const defaultOptions = {
        text: text,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
        useSVG: false
    };
    
    const qrOptions = { ...defaultOptions, ...options };
    
    try {
        return new QRCode(element, qrOptions);
    } catch (error) {
        console.error('Error generating QR code:', error);
        return null;
    }
}

// ======================
// SMOOTH SCROLLING
// ======================
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip empty hash
            if (href === '#') return;
            
            // Check if it's a same-page anchor
            const targetElement = document.querySelector(href);
            if (targetElement) {
                e.preventDefault();
                
                const headerHeight = document.querySelector('header')?.offsetHeight || 80;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Update URL without page jump
                history.pushState(null, null, href);
            }
        });
    });
}

// ======================
// FORM VALIDATION
// ======================
function initFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
                // Scroll to first error
                const firstError = this.querySelector('.error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstError.focus();
                }
            }
        });
        
        // Real-time validation
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    validateField(input);
                }
            });
        });
    });
}

function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Clear previous error
    field.classList.remove('error');
    const errorSpan = field.parentElement.querySelector('.field-error');
    if (errorSpan) errorSpan.remove();
    
    // Check required
    if (field.required && !value) {
        isValid = false;
        errorMessage = field.dataset.errorRequired || 'This field is required';
    }
    
    // Check email format
    else if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = field.dataset.errorEmail || 'Please enter a valid email address';
        }
    }
    
    // Check phone format
    else if (field.type === 'tel' && value) {
        const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
            isValid = false;
            errorMessage = field.dataset.errorPhone || 'Please enter a valid phone number';
        }
    }
    
    // Check min length
    else if (field.dataset.minLength && value.length < parseInt(field.dataset.minLength)) {
        isValid = false;
        errorMessage = field.dataset.errorMinLength || `Minimum ${field.dataset.minLength} characters required`;
    }
    
    // Check max length
    else if (field.dataset.maxLength && value.length > parseInt(field.dataset.maxLength)) {
        isValid = false;
        errorMessage = field.dataset.errorMaxLength || `Maximum ${field.dataset.maxLength} characters allowed`;
    }
    
    // Check pattern
    else if (field.pattern && value) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(value)) {
            isValid = false;
            errorMessage = field.dataset.errorPattern || 'Invalid format';
        }
    }
    
    if (!isValid) {
        field.classList.add('error');
        
        // Add error message
        const errorSpan = document.createElement('span');
        errorSpan.className = 'field-error';
        errorSpan.textContent = errorMessage;
        field.parentElement.appendChild(errorSpan);
        
        // Add ARIA attributes
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', `error-${field.id}`);
    } else {
        field.setAttribute('aria-invalid', 'false');
    }
    
    return isValid;
}

// ======================
// UTILITY FUNCTIONS
// ======================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ======================
// OFFLINE DETECTION
// ======================
function initOfflineDetection() {
    function updateOnlineStatus() {
        if (navigator.onLine) {
            document.documentElement.classList.remove('offline');
            showAlert('You are back online!', 'success', 3000);
            // Refresh data when coming back online
            updateRealTimeStats();
        } else {
            document.documentElement.classList.add('offline');
            showAlert('You are currently offline. Some features may be limited.', 'warning', 5000);
        }
    }
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial check
    updateOnlineStatus();
}

// ======================
// ANIMATION HELPERS
// ======================
function animateOnScroll() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements with animation class
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// ======================
// INITIALIZE ALL
// ======================
// Call after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initImageSlider();
    initDarkMode();
    initDevelopersSlider();
    initVotingSystem();
    initLocationDetection();
    initOfflineDetection();
    initSmoothScrolling();
    initFormValidation();
    animateOnScroll();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initial data load
    updateRealTimeStats();
    
    // Add CSS for animations and alerts
    addDynamicStyles();
});

// ======================
// DYNAMIC STYLES
// ======================
function addDynamicStyles() {
    const styles = `
        /* Error states */
        .error {
            border-color: #dc3545 !important;
            box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
            animation: shake 0.5s ease-in-out;
        }
        
        .field-error {
            color: #dc3545;
            font-size: 0.875rem;
            margin-top: 0.25rem;
            display: block;
        }
        
        /* Alert styles */
        .custom-alert {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: opacity 0.3s, transform 0.3s;
        }
        
        .custom-alert.show {
            opacity: 1;
            transform: translateX(0);
        }
        
        .alert-success {
            background: #d4edda;
            color: #155724;
            border-left: 4px solid #28a745;
        }
        
        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border-left: 4px solid #dc3545;
        }
        
        .alert-warning {
            background: #fff3cd;
            color: #856404;
            border-left: 4px solid #ffc107;
        }
        
        .alert-info {
            background: #d1ecf1;
            color: #0c5460;
            border-left: 4px solid #17a2b8;
        }
        
        .alert-icon {
            font-weight: bold;
            font-size: 1.25rem;
        }
        
        .alert-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            margin-left: auto;
            opacity: 0.7;
            transition: opacity 0.2s;
        }
        
        .alert-close:hover {
            opacity: 1;
        }
        
        /* Stats styles */
        .stats-container {
            background: var(--card-bg);
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: var(--shadow);
        }
        
        .stats-grid {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .stat-item {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .stat-candidate {
            font-weight: 600;
            color: var(--text-color);
        }
        
        .stat-bar-container {
            height: 8px;
            background: var(--border-color);
            border-radius: 4px;
            overflow: hidden;
        }
        
        .stat-bar {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            border-radius: 4px;
            transition: width 1s ease-in-out;
        }
        
        .stat-numbers {
            display: flex;
            justify-content: space-between;
            font-size: 0.875rem;
            color: var(--text-muted);
        }
        
        /* Animations */
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .animate-on-scroll {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .animate-on-scroll.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Slider dots */
        .slider-dots {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            margin-top: 1rem;
        }
        
        .slider-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--border-color);
            cursor: pointer;
            transition: background 0.3s, transform 0.3s;
        }
        
        .slider-dot.active {
            background: var(--primary-color);
            transform: scale(1.2);
        }
        
        .slider-dot:hover {
            background: var(--primary-color);
            transform: scale(1.1);
        }
        
        /* Offline state */
        .offline .online-only {
            opacity: 0.5;
            pointer-events: none;
        }
        
        .offline-stats {
            text-align: center;
            padding: 2rem;
        }
        
        .offline-message {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            color: var(--text-muted);
        }
        
        /* Disabled button styles */
        .disabled {
            opacity: 0.6;
            cursor: not-allowed !important;
        }
        
        .disabled:hover {
            transform: none !important;
            box-shadow: none !important;
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

// ======================
// EXPORT FUNCTIONS (for debugging)
// ======================
if (typeof window !== 'undefined') {
    window.VotingSystem = {
        initImageSlider,
        initDarkMode,
        initDevelopersSlider,
        initVotingSystem,
        initLocationDetection,
        updateRealTimeStats,
        submitVote,
        showAlert,
        generateQRCode,
        validateForm
    };
}