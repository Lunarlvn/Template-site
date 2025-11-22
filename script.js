// Discord OAuth2 Configuration
const DISCORD_CLIENT_ID = '1404538157508071485'; // Wagu Bot Application ID
const DISCORD_REDIRECT_URI = 'http://localhost:3000/auth/callback'; // Port 3000'e geri döndük
// include 'guilds' scope so we can list user's guilds for the admin panel
const DISCORD_SCOPE = 'identify email guilds';

// Discord OAuth2 Functions
function loginWithDiscord() {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=${DISCORD_SCOPE}`;
    window.location.href = discordAuthUrl;
}

function logout() {
    localStorage.removeItem('discord_user');
    localStorage.removeItem('discord_token');
    updateAuthUI();
    showNotification('Başarıyla çıkış yapıldı!', 'success');
}

function updateAuthUI() {
    const user = JSON.parse(localStorage.getItem('discord_user') || 'null');
    const loginSection = document.getElementById('login-section');
    const userSection = document.getElementById('user-section');
    
    if (user) {
        loginSection.style.display = 'none';
        userSection.style.display = 'flex';
        const avatarUrl = user.avatar 
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
            : `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`;
        const smallAvatarUrl = user.avatar 
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`
            : `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`;

        const ua = document.getElementById('user-avatar');
        const un = document.getElementById('user-name');
        const ud = document.getElementById('user-discriminator');
        const da = document.getElementById('dropdown-avatar');
        const dn = document.getElementById('dropdown-name');
        const dd = document.getElementById('dropdown-disc');

        if (ua) ua.src = smallAvatarUrl;
    if (un) un.textContent = user.username;
    // hide discriminator (do not show #0000 next to username)
    if (ud) ud.style.display = 'none';
        if (da) da.src = avatarUrl;
    if (dn) dn.textContent = user.username;
    if (dd) dd.style.display = 'none';
    } else {
        loginSection.style.display = 'flex';
        userSection.style.display = 'none';
    }
}

function toggleProfileDropdown() {
    const dd = document.getElementById('profile-dropdown');
    if (!dd) return;
    dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Exchange Discord OAuth2 code for token and user info
async function exchangeCodeForToken(code) {
    try {
        showNotification('Discord bilgileri alınıyor...', 'info');
        
        // Backend'e code gönder
        const response = await fetch('/auth/exchange', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: code })
        });
        
        if (!response.ok) {
            throw new Error('Token exchange failed');
        }
        
        const data = await response.json();
    // response received from backend
        
        if (data.user) {
            localStorage.setItem('discord_user', JSON.stringify(data.user));
            localStorage.setItem('discord_token', data.access_token);
            
            updateAuthUI();
            showNotification('Discord ile başarıyla giriş yapıldı!', 'success');
        } else {
            throw new Error('User data not received');
        }
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
    } catch (error) {
        // Show user-friendly notification on failure
        showNotification('Discord girişi başarısız!', 'error');
    }
}

// Check for Discord OAuth callback
function handleDiscordCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
        showNotification('Discord girişi başarısız!', 'error');
        return;
    }
    
    if (code) {
        // Gerçek Discord OAuth2 token exchange
        exchangeCodeForToken(code);
    }
}

// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const commandCategories = document.querySelectorAll('.command-category');

    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Navigation link clicks
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show corresponding section
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            // Close mobile menu if open
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Command category functionality
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        const header = item.querySelector('.category-header');
        const commands = item.querySelector('.category-commands');
        const arrow = item.querySelector('.category-arrow');
        
        header.addEventListener('click', function() {
            // Toggle active class
            item.classList.toggle('active');
            
            // Toggle commands visibility
            if (item.classList.contains('active')) {
                commands.style.display = 'block';
                arrow.style.transform = 'rotate(90deg)';
            } else {
                commands.style.display = 'none';
                arrow.style.transform = 'rotate(0deg)';
            }
        });
    });

    // Smooth scrolling for internal links
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

    // Add scroll effect to navbar
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(0, 0, 0, 0.98)';
        } else {
            navbar.style.background = 'rgba(0, 0, 0, 0.95)';
        }
    });

    // Add hover effects to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Remove typing effect from hero title - keep it simple
    // const heroTitle = document.querySelector('.hero-title');
    // if (heroTitle) {
    //     const text = heroTitle.textContent;
    //     heroTitle.textContent = '';
    //     let i = 0;
    //     
    //     function typeWriter() {
    //         if (i < text.length) {
    //             heroTitle.textContent += text.charAt(i);
    //             i++;
    //             setTimeout(typeWriter, 150);
    //         }
    //     }
    //     
    //     // Start typing effect after a short delay
    //     setTimeout(typeWriter, 1000);
    // }

    // Add floating particles animation
    function createFloatingParticles() {
        const particlesContainer = document.querySelector('.particles');
        if (!particlesContainer) return;

        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
            particlesContainer.appendChild(particle);
        }
    }

    // Initialize floating particles
    createFloatingParticles();

    // Initialize auth system
    updateAuthUI();
    handleDiscordCallback();

    // Close profile dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dd = document.getElementById('profile-dropdown');
        const btn = document.getElementById('user-profile-btn');
        if (!dd || !btn) return;
        if (!btn.contains(e.target) && !dd.contains(e.target)) {
            dd.style.display = 'none';
        }
    });

    // Add parallax effect to hero background
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const animeBg = document.querySelector('.anime-bg');
        if (animeBg) {
            animeBg.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });

    // Add fade-in animation to elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all sections for fade-in effect
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    // Add click effects to command items
    const commandItems = document.querySelectorAll('.command-item');
    commandItems.forEach(item => {
        item.addEventListener('click', function() {
            this.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
            this.style.color = 'white';
            this.style.transform = 'translateX(8px) scale(1.05)';
            
            setTimeout(() => {
                this.style.background = 'linear-gradient(135deg, #1f2937, #374151)';
                this.style.color = '';
                this.style.transform = 'translateX(8px) scale(1.02)';
            }, 300);
        });
    });

    // Add pulse animation to status button
    const statusBtn = document.querySelector('.btn-status');
    if (statusBtn) {
        setInterval(() => {
            statusBtn.style.animation = 'pulse 2s ease-in-out';
            setTimeout(() => {
                statusBtn.style.animation = '';
            }, 2000);
        }, 5000);
    }

    // Add glow effect to section titles
    const sectionTitles = document.querySelectorAll('.section-title');
    sectionTitles.forEach(title => {
        title.addEventListener('mouseenter', function() {
            this.style.textShadow = '0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(139, 92, 246, 0.5)';
        });
        
        title.addEventListener('mouseleave', function() {
            this.style.textShadow = '0 0 20px rgba(59, 130, 246, 0.3)';
        });
    });

    // Add loading animation
    window.addEventListener('load', function() {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
    });

    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close mobile menu
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });

    // Add ripple effect to buttons
    function createRipple(event) {
        const button = event.currentTarget;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
        circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
        circle.classList.add('ripple');

        const ripple = button.getElementsByClassName('ripple')[0];
        if (ripple) {
            ripple.remove();
        }

        button.appendChild(circle);
    }

    buttons.forEach(btn => {
        btn.addEventListener('click', createRipple);
    });

    // Add CSS for ripple effect
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        }

        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});
