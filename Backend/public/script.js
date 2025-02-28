// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            // Create mobile menu if it doesn't exist
            if (!document.querySelector('.mobile-menu')) {
                const mobileMenu = document.createElement('div');
                mobileMenu.className = 'mobile-menu';

                const navLinks = document.querySelector('.nav-links').cloneNode(true);
                const authButtons = document.querySelector('.auth-buttons').cloneNode(true);

                mobileMenu.appendChild(navLinks);
                mobileMenu.appendChild(authButtons);

                document.querySelector('header').appendChild(mobileMenu);

                // Add close button
                const closeBtn = document.createElement('button');
                closeBtn.className = 'mobile-menu-close';
                closeBtn.innerHTML = '<i class="fas fa-times"></i>';
                mobileMenu.prepend(closeBtn);

                closeBtn.addEventListener('click', function() {
                    mobileMenu.classList.remove('active');
                    document.body.classList.remove('menu-open');
                });
            }

            const mobileMenu = document.querySelector('.mobile-menu');
            mobileMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
    }

    // Initialize emergency modal
    const emergencyBtn = document.getElementById('emergencyBtn');
    const emergencyModal = document.getElementById('emergencyModal');
    const closeModal = document.querySelector('.close');

    if (emergencyBtn && emergencyModal) {
        emergencyBtn.addEventListener('click', function() {
            emergencyModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });

        closeModal.addEventListener('click', function() {
            emergencyModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });

        window.addEventListener('click', function(event) {
            if (event.target === emergencyModal) {
                emergencyModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Testimonial Slider
    initTestimonialSlider();

    // Add smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');

            if (targetId === '#') return;

            e.preventDefault();

            const target = document.querySelector(targetId);
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add scroll animation for elements
    const fadeElements = document.querySelectorAll('.feature-card, .step, .testimonial-content');

    const fadeOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px"
    };

    const fadeObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, fadeOptions);

    fadeElements.forEach(element => {
        element.classList.add('fade-element');
        fadeObserver.observe(element);
    });
});

// Testimonial Slider
let currentSlideIndex = 0;
const slides = document.querySelectorAll('.testimonial-slide');

function initTestimonialSlider() {
    if (slides.length === 0) return;

    showSlide(currentSlideIndex);

    // Auto slide change
    setInterval(function() {
        changeSlide(1);
    }, 5000);
}

function showSlide(index) {
    if (slides.length === 0) return;

    // Reset all slides
    slides.forEach(slide => {
        slide.classList.remove('active');
    });

    // Reset all dots
    const dots = document.querySelectorAll('.dot');
    dots.forEach(dot => {
        dot.classList.remove('active');
    });

    // Show current slide
    slides[index].classList.add('active');

    // Highlight current dot
    dots[index].classList.add('active');
}

function changeSlide(direction) {
    if (slides.length === 0) return;

    currentSlideIndex += direction;

    // Loop back to first slide if at the end
    if (currentSlideIndex >= slides.length) {
        currentSlideIndex = 0;
    }

    // Loop to last slide if going before first
    if (currentSlideIndex < 0) {
        currentSlideIndex = slides.length - 1;
    }

    showSlide(currentSlideIndex);
}

function currentSlide(index) {
    currentSlideIndex = index;
    showSlide(currentSlideIndex);
}

// Add dynamic year to copyright
document.addEventListener('DOMContentLoaded', function() {
    const yearElements = document.querySelectorAll('.current-year');
    const currentYear = new Date().getFullYear();

    yearElements.forEach(element => {
        element.textContent = currentYear;
    });
});

// Sticky Header Effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');

    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Add CSS for fadein animation
const style = document.createElement('style');
style.textContent = `
    .fade-element {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }

    .fade-in {
        opacity: 1;
        transform: translateY(0);
    }

    .mobile-menu {
        position: fixed;
        top: 0;
        right: -100%;
        width: 80%;
        max-width: 400px;
        height: 100vh;
        background-color: white;
        z-index: 1000;
        padding: 80px 30px 30px;
        transition: right 0.3s ease;
        box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
        overflow-y: auto;
    }

    .mobile-menu.active {
        right: 0;
    }

    body.menu-open {
        overflow: hidden;
    }

    .mobile-menu .nav-links {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-bottom: 30px;
    }

    .mobile-menu .nav-links li {
        margin: 0;
    }

    .mobile-menu .auth-buttons {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }

    .mobile-menu .auth-buttons a {
        width: 100%;
        text-align: center;
    }

    .mobile-menu-close {
        position: absolute;
        top: 20px;
        right: 20px;
        background: none;
        border: none;
        font-size: 1.5rem;
        color: var(--dark-color);
        cursor: pointer;
    }

    header.scrolled {
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        padding: 10px 0;
    }
`;

document.head.appendChild(style);
