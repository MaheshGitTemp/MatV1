 // src/components/pages/public/Home.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../../assets/css/Home.css';

// ── Reusable Scroll Reveal Component ──────────────────────────────────────
const RevealOnScroll = ({ children, className = '', delay = 0 }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target); // Stop observing once revealed
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      className={`reveal-element ${className} ${isVisible ? 'reveal-active' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// ── Custom Hooks ─────────────────────────────────────────────────────────
// Replace the existing useTypewriter hook with this:
 // ─ Bulletproof Typewriter Hook ───────────────────────────────────────────
const useTypewriter = (text, speed = 60) => {
  const [displayText, setDisplayText] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let currentIndex = 0;
    setDisplayText(''); // Reset text on mount
    setIsFinished(false); // Reset finished state

    const timer = setInterval(() => {
      currentIndex++;
      if (currentIndex <= text.length) {
        // FIX: Use substring instead of appending. 
        // This prevents double letters like "Partnerr" even if React runs this twice.
        setDisplayText(text.substring(0, currentIndex));
      } else {
        setIsFinished(true);
        clearInterval(timer);
      }
    }, speed);

    // Strict cleanup to kill any lingering intervals
    return () => {
      clearInterval(timer);
    };
  }, [text, speed]);

  return { displayText, isFinished };
};

const useCountUp = (end, duration = 2000) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); } 
      else { setCount(Math.ceil(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, end, duration]);

  return { count, ref };
};

const useScrollProgress = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPosition = window.scrollY;
      setProgress((scrollPosition / totalHeight) * 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return progress;
};

const useParallax = () => {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return;
    const handleScroll = () => setOffset(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return offset;
};

const HeartBurst = ({ active }) => {
  if (!active) return null;
  return (
    <div className="heart-burst-container">
      {[...Array(8)].map((_, i) => (
        <i key={i} className="fas fa-heart burst-particle" style={{ '--i': i }}></i>
      ))}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────
const Home = () => {
      const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const { displayText: typedText, isFinished: typingFinished } = useTypewriter('Find Your Perfect Life Partner', 60);
  const scrollProgress = useScrollProgress();
  const parallaxOffset = useParallax();
  const [burstActive, setBurstActive] = useState(false);

  const stat1 = useCountUp(50000);
  const stat2 = useCountUp(10000);
  const stat3 = useCountUp(100);
  const stat4 = useCountUp(24);

  const testimonials = [
    { name: 'Rahul & Priya', text: 'We found our soulmate within a month! The privacy features made us feel completely safe.', role: 'Married in 2024' },
    { name: 'Amit & Sneha', text: 'The advanced filters helped us find exactly what we were looking for. Highly recommended!', role: 'Married in 2023' },
    { name: 'Vikram & Anjali', text: 'A seamless experience from start to finish. The mobile interface is incredibly smooth.', role: 'Married in 2025' },
  ];
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length), 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleRegisterClick = (e) => {
    // e.preventDefault();
    setBurstActive(true);
    setTimeout(() => setBurstActive(false), 800);
  };

  return (
    <div className="home-page">
      <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }}></div>
      
      <div className="floating-elements">
        <div className="float-heart h1" style={{ transform: `translateY(${parallaxOffset * 0.1}px)` }}><i className="fas fa-heart"></i></div>
        <div className="float-heart h2" style={{ transform: `translateY(${parallaxOffset * -0.15}px)` }}><i className="fas fa-ring"></i></div>
        <div className="float-heart h3" style={{ transform: `translateY(${parallaxOffset * 0.2}px)` }}><i className="fas fa-heart"></i></div>
        <div className="float-heart h4" style={{ transform: `translateY(${parallaxOffset * -0.1}px)` }}><i className="fas fa-dove"></i></div>
      </div>

      {/* ── 1. Hero Section ─────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="container hero-container">
          <div className="hero-text">
            <span className={`hero-badge ${typingFinished ? 'shimmer-badge' : ''}`}>
               Trusted by 10,000+ Families
            </span>
            <h1>
              {typedText}<span className="cursor">|</span>
            </h1>
            <p>India's most trusted matrimony service. Join today and begin your journey to a happy married life with verified profiles and complete privacy.</p>
            <div className="hero-cta-group">
              {!isLoggedIn ? (
                <>
                  <Link to="/signup" className="btn btn-primary btn-radar ripple-btn" onClick={handleRegisterClick}>
                    Register Free
                    <HeartBurst active={burstActive} />
                  </Link>
                  <Link to="/login" className="btn btn-outline ripple-btn">Login</Link>
                </>
              ) : (
                <Link to="/profiles" className="btn btn-primary ripple-btn">View Matches</Link>
              )}
            </div>
          </div>

          {/* Quick Search is only for logged-in users (it searches protected
              /profiles). Hidden for guests. */}
          {isLoggedIn && (
          <RevealOnScroll className="slide-in-right" delay={300}>
            <div className="search-widget">
              <h3>Quick Search</h3>
              <form action="/profiles" method="get">
                <div className="form-group input-underline">
                  <label>Looking For</label>
                  <select name="gender" required className="glow-input">
                    <option value="">Select</option>
                    <option value="Female">Bride (Female)</option>
                    <option value="Male">Groom (Male)</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group input-underline">
                    <label>Age From</label>
                    <select name="ageFrom" className="glow-input">
                      {Array.from({length: 33}, (_, i) => i + 18).map(age => <option key={age} value={age}>{age}</option>)}
                    </select>
                  </div>
                  <div className="form-group input-underline">
                    <label>Age To</label>
                    <select name="ageTo" className="glow-input">
                      {Array.from({length: 33}, (_, i) => i + 18).map(age => <option key={age} value={age}>{age}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-block ripple-btn">Search Profiles</button>
              </form>
            </div>
          </RevealOnScroll>
          )}
        </div>
      </section>

      {/* ── 2. Stats Section ───────────────────────────────────────────── */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <RevealOnScroll delay={0}>
              <div className="stat-card">
                <i className="fas fa-users pulse-icon"></i>
                <h2>{stat1.count.toLocaleString()}+</h2>
                <p>Active Profiles</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={150}>
              <div className="stat-card">
                <i className="fas fa-heart pulse-icon"></i>
                <h2>{stat2.count.toLocaleString()}+</h2>
                <p>Happy Couples</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={300}>
              <div className="stat-card">
                <i className="fas fa-shield-alt pulse-icon"></i>
                <h2>{stat3.count}%</h2>
                <p>Verified Profiles</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={450}>
              <div className="stat-card">
                <i className="fas fa-headset pulse-icon"></i>
                <h2>{stat4.count}/7</h2>
                <p>Support</p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ── 3. How It Works ─────────────────────────────────────────────── */}
      <section className="how-it-works">
        <div className="container">
          <RevealOnScroll>
            <div className="section-header sticky-header">
              <span className="section-subtitle">Simple Process</span>
              <h2>How It Works</h2>
              <div className="title-bar"></div>
            </div>
          </RevealOnScroll>
          <div className="steps-grid">
            <RevealOnScroll delay={0}>
              <div className="step-card">
                <div className="step-icon"><i className="fas fa-user-plus"></i><span className="step-number">1</span></div>
                <h3>Register Free</h3>
                <p>Create your profile in minutes. Add your details, preferences, and upload photos securely.</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <div className="step-card">
                <div className="step-icon"><i className="fas fa-search"></i><span className="step-number">2</span></div>
                <h3>Search & Connect</h3>
                <p>Use advanced filters to find matches. Send proposals or messages to profiles you like.</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={400}>
              <div className="step-card">
                <div className="step-icon"><i className="fas fa-handshake"></i><span className="step-number">3</span></div>
                <h3>Meet & Marry</h3>
                <p>Take the conversation forward, meet the family, and begin your new journey together.</p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ── 4. Features Section ─────────────────────────────────────────── */}
      <section className="features-section">
        <div className="container">
          <RevealOnScroll>
            <div className="section-header sticky-header">
              <span className="section-subtitle">Our Promise</span>
              <h2>Why Choose Us</h2>
              <div className="title-bar"></div>
            </div>
          </RevealOnScroll>
          <div className="features-grid">
            <RevealOnScroll className="zoom" delay={0}>
              <div className="feature-box">
                <i className="fas fa-lock rotate-icon"></i>
                <h4>100% Privacy</h4>
                <p>Your contact details are hidden. You control who sees your information.</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll className="zoom" delay={150}>
              <div className="feature-box">
                <i className="fas fa-check-circle rotate-icon"></i>
                <h4>Verified Profiles</h4>
                <p>We manually verify profiles to ensure a safe and trustworthy experience.</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll className="zoom" delay={300}>
              <div className="feature-box">
                <i className="fas fa-mobile-alt rotate-icon"></i>
                <h4>Mobile Friendly</h4>
                <p>Access your account seamlessly on any device, anywhere, anytime.</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll className="zoom" delay={450}>
              <div className="feature-box">
                <i className="fas fa-gem rotate-icon"></i>
                <h4>Premium Support</h4>
                <p>Our dedicated relationship managers are here to assist you at every step.</p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ── 5. Testimonials Slider ──────────────────────────────────────── */}
      <section className="testimonials-section">
        <div className="container">
          <RevealOnScroll>
            <div className="section-header">
              <span className="section-subtitle">Love Stories</span>
              <h2>Success Stories</h2>
              <div className="title-bar"></div>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <div className="testimonial-slider">
              <div className="testimonial-track" style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}>
                {testimonials.map((t, index) => (
                  <div className="testimonial-card" key={index}>
                    <i className="fas fa-quote-left quote-icon"></i>
                    <p className="testimonial-text">"{t.text}"</p>
                    <div className="testimonial-author">
                      <div className="author-avatar"><i className="fas fa-user"></i></div>
                      <div>
                        <h4>{t.name}</h4>
                        <span>{t.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="slider-dots">
                {testimonials.map((_, index) => (
                  <button key={index} className={`dot ${index === activeTestimonial ? 'active' : ''}`} onClick={() => setActiveTestimonial(index)} aria-label={`Go to slide ${index + 1}`} />
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── 6. Final CTA ────────────────────────────────────────────────── */}
      <section className="final-cta">
        <div className="cta-gradient-bg"></div>
        <RevealOnScroll>
          <div className="container">
            <h2>Ready to Find Your Soulmate?</h2>
            <p>Join thousands of happy couples who found their perfect match with us.</p>
            {!isLoggedIn && (
              <Link to="/signup" className="btn btn-white ripple-btn" onClick={handleRegisterClick}>
                Register Now - It's Free
                <HeartBurst active={burstActive} />
              </Link>
            )}
          </div>
        </RevealOnScroll>
      </section>
    </div>
  );
};

export default Home;
