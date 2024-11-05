 
// Common Animation Observer
const createIntersectionObserver = (options = {}) => {
    return new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Unobserve after animation is triggered
                if (!options.persistent) {
                    observer.unobserve(entry.target);
                }
            }
        });
    }, {
       threshold: 0.1, // Reduced threshold for earlier trigger
        rootMargin: "50px 0px -50px 0px", // Adjusted margin for better timing
        ...options
    });
};

// Home Section Scripts
document.addEventListener('DOMContentLoaded', () => {
    // Scroll down button functionality
    const scrollDownBtn = document.querySelector('.scroll-down');
    if (scrollDownBtn) {
        scrollDownBtn.addEventListener('click', () => {
            document.querySelector('#about').scrollIntoView({ behavior: 'smooth' });
        });
    }
});

// About Section Scripts
const aboutObserver = createIntersectionObserver();
document.querySelectorAll('.profile-card, .about-text, .timeline-item').forEach(el => {
    aboutObserver.observe(el);
});

// Portfolio Section Scripts
const initPortfolio = () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    const lightbox = document.querySelector('.portfolio-lightbox');
    const lightboxImg = lightbox?.querySelector('img');
    const lightboxClose = lightbox?.querySelector('.portfolio-lightbox-close');

    // Portfolio filtering
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;
            
            portfolioItems.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.style.display = 'block';
                    setTimeout(() => item.classList.add('visible'), 100);
                } else {
                    item.classList.remove('visible');
                    setTimeout(() => item.style.display = 'none', 500);
                }
            });
        });
    });

    // Lightbox functionality
    if (lightbox && lightboxImg && lightboxClose) {
        portfolioItems.forEach(item => {
            item.addEventListener('click', () => {
                const imgSrc = item.querySelector('img').src;
                lightboxImg.src = imgSrc;
                lightbox.classList.add('active');
            });
        });

        // Close lightbox when clicking close button
        lightboxClose.addEventListener('click', () => {
            lightbox.classList.remove('active');
        });

        // Close lightbox when clicking outside
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
            }
        });

        // Close lightbox with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                lightbox.classList.remove('active');
            }
        });
    }

    // Initialize portfolio items as visible
    setTimeout(() => {
        portfolioItems.forEach(item => item.classList.add('visible'));
    }, 500);
};

// Testimonials Section Scripts
const testimonialObserver = createIntersectionObserver();
document.querySelectorAll('.testimonial-card').forEach(el => {
    testimonialObserver.observe(el);
});

// Contact Section Scripts
const initContact = () => {
    const contactForm = document.getElementById('contactForm');
    const contactAnimations = document.querySelectorAll('.contact-animate-slide, .contact-animate-fade');

    // Form submission
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = {
                name: contactForm.querySelector('#name').value,
                email: contactForm.querySelector('#email').value,
                service: contactForm.querySelector('#service').value,
                message: contactForm.querySelector('#message').value
            };

            try {
                // Here you would typically send the form data to your server
                // For now, we'll just show a success message
                alert('Message sent successfully!');
                contactForm.reset();
            } catch (error) {
                alert('There was an error sending your message. Please try again.');
            }
        });
    }

    // Contact animations
    const contactObserver = createIntersectionObserver();
    contactAnimations.forEach(el => {
        contactObserver.observe(el);
    });
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize portfolio functionality
    initPortfolio();
    
    // Initialize contact functionality
    initContact();
    
    // Handle smooth scrolling for all internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Handle active section highlighting in navigation
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        // Update navigation active state if you have section-specific navigation
        document.querySelectorAll('.nav-content a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
            }
        });
    });
});

// Optional: Add image lazy loading
document.addEventListener('DOMContentLoaded', () => {
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
});
