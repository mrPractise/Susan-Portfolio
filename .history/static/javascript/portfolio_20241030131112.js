
// portfolio.js
document.addEventListener("DOMContentLoaded", () => {
    const filterButtons = document.querySelectorAll(".filter-btn");
    const portfolioItems = document.querySelectorAll(".portfolio-item");
    const lightbox = document.querySelector(".portfolio-lightbox");
    const lightboxImg = lightbox?.querySelector(".lightbox-image-container img");
    const lightboxTitle = lightbox?.querySelector(".lightbox-title");
    const lightboxDesc = lightbox?.querySelector(".lightbox-description");
    const lightboxDate = lightbox?.querySelector(".metadata-date");
    const lightboxCategory = lightbox?.querySelector(".metadata-category");
    const lightboxClose = lightbox?.querySelector(".lightbox-close");

    // Initialize portfolio items with staggered animation
    portfolioItems.forEach((item, index) => {
        setTimeout(() => {
            item.querySelector('.portfolio-card').classList.add("visible");
        }, 100 * index);
    });

    // Portfolio filtering with smooth transitions
    filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            // Update active button state
            filterButtons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            const filter = btn.dataset.filter;
            
            // Filter items with staggered animations
            portfolioItems.forEach((item, index) => {
                const card = item.querySelector('.portfolio-card');
                const shouldShow = filter === "all" || item.dataset.category === filter;
                
                if (shouldShow) {
                    item.style.display = "block";
                    setTimeout(() => {
                        card.classList.add("visible");
                    }, 100 * index);
                } else {
                    card.classList.remove("visible");
                    setTimeout(() => {
                        item.style.display = "none";
                    }, 400);
                }
            });
        });
    });

    // Enhanced lightbox functionality
    if (lightbox && lightboxImg) {
        portfolioItems.forEach((item) => {
            const viewButton = item.querySelector(".view-project");
            viewButton?.addEventListener("click", (e) => {
                e.preventDefault();
                const img = item.querySelector("img");
                const title = item.querySelector("h3").textContent;
                const desc = item.querySelector("p").textContent;
                const category = item.querySelector(".category").textContent;
                
                lightboxImg.src = img.src;
                lightboxTitle.textContent = title;
                lightboxDesc.textContent = desc;
                lightboxCategory.textContent = category;
                lightboxDate.textContent = new Date().toLocaleDateString();
                
                lightbox.classList.add("active");
                document.body.style.overflow = "hidden";
            });
        });

        // Close lightbox handlers
        const closeLightbox = () => {
            lightbox.classList.remove("active");
            document.body.style.overflow = "";
        };

        lightboxClose?.addEventListener("click", closeLightbox);
        
        lightbox.addEventListener("click", (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && lightbox.classList.contains("active")) {
                closeLightbox();
            }
        });
    }

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "50px"
    };

    // Continuing portfolio.js
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target.querySelector('.portfolio-card');
                if (card) {
                    card.classList.add('visible');
                }
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all portfolio items for scroll animations
    portfolioItems.forEach(item => {
        observer.observe(item);
    });

    // Add hover effect for portfolio cards
    portfolioItems.forEach(item => {
        const card = item.querySelector('.portfolio-card');
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate rotation based on mouse position
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            // Apply the transform
            card.style.transform = `
                perspective(1000px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                scale3d(1.02, 1.02, 1.02)
            `;
        });
        
        // Reset transform on mouse leave
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });

    // Add loading animation for images
    const portfolioImages = document.querySelectorAll('.portfolio-image img');
    portfolioImages.forEach(img => {
        // Add loading class
        img.parentElement.classList.add('loading');
        
        img.addEventListener('load', () => {
            // Remove loading class when image is loaded
            img.parentElement.classList.remove('loading');
            img.parentElement.classList.add('loaded');
        });
    });

    // Add smooth scroll for filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Smooth scroll to show filtered items
            const portfolioSection = document.querySelector('.portfolio-grid');
            const offset = portfolioSection.offsetTop - 100;
            
            window.scrollTo({
                top: offset,
                behavior: 'smooth'
            });
        });
    });

    // Add touch support for mobile devices
    if ('ontouchstart' in window) {
        portfolioItems.forEach(item => {
            const card = item.querySelector('.portfolio-card');
            const overlay = item.querySelector('.portfolio-overlay');
            
            card.addEventListener('touchstart', () => {
                overlay.style.opacity = '1';
            });
            
            card.addEventListener('touchend', () => {
                setTimeout(() => {
                    overlay.style.opacity = '0';
                }, 1000);
            });
        });
    }

    // Add masonry layout effect
    let masonryTimeout;
    function updateMasonryLayout() {
        clearTimeout(masonryTimeout);
        masonryTimeout = setTimeout(() => {
            const grid = document.querySelector('.portfolio-grid');
            const items = Array.from(portfolioItems);
            const columns = Math.floor(grid.offsetWidth / 350);
            
            if (columns > 1) {
                const columnHeights = new Array(columns).fill(0);
                
                items.forEach((item, index) => {
                    // Find shortest column
                    const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
                    
                    // Position item
                    const x = (shortestColumn * 100 / columns) + '%';
                    const y = columnHeights[shortestColumn] + 'px';
                    item.style.transform = `translate(${x}, ${y})`;
                    
                    // Update column height
                    columnHeights[shortestColumn] += item.offsetHeight + 20; // 20px gap
                });
                
                // Update grid height
                grid.style.height = Math.max(...columnHeights) + 'px';
            } else {
                // Reset styles for single column
                items.forEach(item => {
                    item.style.transform = '';
                });
                grid.style.height = '';
            }
        }, 100);
    }

    // Initialize masonry layout
    updateMasonryLayout();
    window.addEventListener('resize', updateMasonryLayout);

    // Add keyboard navigation for lightbox
    if (lightbox) {
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            
            if (e.key === 'ArrowLeft') {
                navigateLightbox('prev');
            } else if (e.key === 'ArrowRight') {
                navigateLightbox('next');
            }
        });
    }

    function navigateLightbox(direction) {
        const currentItem = Array.from(portfolioItems)
            .find(item => item.querySelector('img').src === lightboxImg.src);
            
        if (!currentItem) return;
        
        let nextItem;
        if (direction === 'next') {
            nextItem = currentItem.nextElementSibling || portfolioItems[0];
        } else {
            nextItem = currentItem.previousElementSibling || portfolioItems[portfolioItems.length - 1];
        }
        
        if (nextItem) {
            const img = nextItem.querySelector('img');
            const title = nextItem.querySelector('h3').textContent;
            const desc = nextItem.querySelector('p').textContent;
            const category = nextItem.querySelector('.category').textContent;
            
            // Animate transition
            lightboxImg.style.opacity = '0';
            setTimeout(() => {
                lightboxImg.src = img.src;
                lightboxTitle.textContent = title;
                lightboxDesc.textContent = desc;
                lightboxCategory.textContent = category;
                lightboxImg.style.opacity = '1';
            }, 200);
        }
    }
});

