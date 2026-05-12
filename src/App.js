import React, { useState, useEffect } from 'react';
import './App.css';
import appLogo from './logo.png';

/* ─── Data ───────────────────────────────────────────────────────── */
const DONATION_DETAILS = [
  {
    id: 'upi-india',
    icon: '📱',
    iconClass: 'upi',
    name: 'UPI Transfer',
    sub: 'PhonePe · GPay · Paytm · Any UPI App',
    type: 'details',
    details: [
      { label: 'Name', value: 'Harsha Kumar' },
      { label: 'UPI Number', value: '8754035972' },
    ],
  },
  {
    id: 'bank-india',
    icon: '🏦',
    iconClass: 'bank',
    name: 'Bank Transfer',
    sub: 'NEFT / RTGS / IMPS',
    type: 'details',
    details: [
      { label: 'Account Name', value: 'Harsha Kumar' },
      { label: 'Account No.', value: '16404100000260' },
      { label: 'IFSC Code', value: 'FDRL0001640' },
      { label: 'Bank', value: 'Federal Bank' },
    ],
  },
];

/* ─── Sub-components ─────────────────────────────────────────── */
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = React.useRef(null);

  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handle} aria-label="Copy">
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      )}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

function PaymentCard({ card }) {
  return (
    <div className="payment-card glass-panel" id={`card-${card.id}`}>
      <div className="payment-card-header">
        <div className={`payment-card-icon ${card.iconClass}`}>{card.icon}</div>
        <div>
          <div className="payment-card-name">{card.name}</div>
          <div className="payment-card-sub">{card.sub}</div>
        </div>
      </div>
      <div className="payment-details-list">
        {card.details && card.details.map((row) => (
          <div className="payment-detail-row" key={row.label}>
            <span className="payment-detail-label">{row.label}</span>
            <div className="payment-detail-action">
              <span className="payment-detail-value">{row.value}</span>
              {row.label !== 'Bank' && <CopyButton text={row.value} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main App ───────────────────────────────────────────────── */
export default function App() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app-container">
      {/* ── Ambient Backgrounds ── */}
      <div className="ambient-backgrounds">
        <div className="ambient-blob blob-1"></div>
        <div className="ambient-blob blob-2"></div>
        <div className="ambient-blob blob-3"></div>
      </div>

      {/* ── Navigation ── */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-brand">
            <img src={appLogo} alt="Logo" className="nav-logo" />
            <span className="nav-title">My Spiritual Assistant</span>
          </div>
          <a href="#donate" className="btn-nav">Support Us</a>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <main className="hero-section">
        <div className="hero-content">
          <div className="pill-badge fade-in-up">
            <span className="pill-dot pulse"></span>
            <span className="pill-text">My Spiritual Assistant</span>
          </div>

          <h1 className="hero-heading fade-in-up delay-1">
            Transform Your <br />
            <span className="text-gradient">Spiritual Life</span>
          </h1>

          <p className="hero-description fade-in-up delay-2">
            A premium spiritual growth and accountability platform. Build consistency, purity, discipline, learning, and devotional happiness in your daily life.
          </p>

          <div className="hero-actions fade-in-up delay-3">
            <a href="#features" className="btn-primary">
              Explore Features
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
            <a href="#problem" className="btn-secondary">Why it matters</a>
          </div>
        </div>
      </main>

      {/* ── Problem Section ── */}
      <section className="section problem-section" id="problem">
        <div className="section-header">
          <h4 className="section-subtitle">THE CHALLENGE</h4>
          <h2 className="section-title">Why Spiritual Health Matters</h2>
          <p className="section-desc">In today’s fast-moving world, maintaining spiritual focus is difficult. We often struggle with consistency.</p>
        </div>

        <div className="struggle-grid">
          {[
            { icon: '🌪️', text: 'Inconsistent chanting & lack of focus' },
            { icon: '📱', text: 'Digital distraction & irregular sādhana' },
            { icon: '⚖️', text: 'Poor lifestyle balance & loss of enthusiasm' },
            { icon: '👥', text: 'Weak association & no accountability' }
          ].map((item) => (
            <div className="struggle-card glass-panel" key={item.text}>
              <div className="struggle-icon">{item.icon}</div>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bento Features Section ── */}
      <section className="section bento-section" id="features">
        <div className="section-header">
          <h4 className="section-subtitle">CORE MODULES</h4>
          <h2 className="section-title">Everything You Need to Grow</h2>
        </div>

        <div className="bento-grid">
          {/* Bento Item 1 */}
          <div className="bento-card bento-large glass-panel">
            <div className="bento-icon-wrapper blue">📅</div>
            <h3>Daily Sādhana Tracking</h3>
            <p>Build consistency through simple and meaningful daily check-ins. Track Japa rounds, Morning program, Scripture reading, Śloka memorization, and Temple visits.</p>
            <div className="bento-tags">
              <span>✓ Japa Quality</span>
              <span>✓ Cleanliness</span>
              <span>✓ Ekādaśī</span>
            </div>
          </div>

          {/* Bento Item 2 */}
          <div className="bento-card glass-panel">
            <div className="bento-icon-wrapper purple">📊</div>
            <h3>Spiritual Health Score</h3>
            <p>Intelligent analytics to identify areas of strength and track lifestyle balance without pressure.</p>
          </div>

          {/* Bento Item 3 */}
          <div className="bento-card glass-panel">
            <div className="bento-icon-wrapper green">🌱</div>
            <h3>Guided Growth</h3>
            <p>Habit-building reminders, personalized encouragement, and a strong accountability system.</p>
          </div>

          {/* Bento Item 4 */}
          <div className="bento-card bento-wide glass-panel">
            <div className="bento-icon-wrapper orange">📚</div>
            <h3>Study & Learning Dashboard</h3>
            <p>Designed especially for serious practitioners and students. Track Bhakti Śāstrī progress, small books completion, verse memorization, and capture realizations.</p>
          </div>
        </div>
      </section>

      {/* ── Audience Section ── */}
      <section className="section audience-section">
        <div className="section-header">
          <h4 className="section-subtitle">WHO IT'S FOR</h4>
          <h2 className="section-title">For Every Stage of the Journey</h2>
        </div>

        <div className="audience-container">
          <div className="audience-item">
            <div className="audience-avatar">🧘‍♂️</div>
            <h4>Individuals</h4>
            <p>Develop strong habits and personal discipline.</p>
          </div>
          <div className="audience-item">
            <div className="audience-avatar">👥</div>
            <h4>Mentors</h4>
            <p>Guide students effectively with meaningful insights.</p>
          </div>
          <div className="audience-item">
            <div className="audience-avatar">🛕</div>
            <h4>Communities</h4>
            <p>Encourage learning and engagement.</p>
          </div>
          <div className="audience-item">
            <div className="audience-avatar">👨‍👩‍👧‍👦</div>
            <h4>Families</h4>
            <p>Create healthy spiritual routines together.</p>
          </div>
        </div>
      </section>

      {/* ── Donate Section ── */}
      <section className="section donate-section">
        <div className="donate-container glass-panel">
          <div className="donate-content">
            <h2 className="donate-title" id="donate">Support The Project</h2>
            <p className="donate-desc">
              My Spiritual Assistant is an effort to combine timeless wisdom with modern technology. Small daily improvements create lifelong transformation. Support the development of this app by contributing below.
            </p>
            <div className="payment-grid">
              {DONATION_DETAILS.map(card => (
                <PaymentCard key={card.id} card={card} />
              ))}
            </div>
            <p className="donate-footer-note">🙏 Your contributions help cover development costs to bring this to spiritual seekers worldwide. Hare Krishna!</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src={appLogo} alt="Logo" className="footer-logo" />
            <span>My Spiritual Assistant</span>
          </div>
          <p className="footer-mantra">Your companion for conscious spiritual growth.</p>
          <div className="footer-copyright">
            © {new Date().getFullYear()} My Spiritual Assistant. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
