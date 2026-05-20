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

const STRUGGLES = [
  { icon: '📿', text: 'Inconsistent chanting' },
  { icon: '🧠', text: 'Lack of focus in prayer and study' },
  { icon: '👥', text: 'Weak association' },
  { icon: '⚖️', text: 'Poor lifestyle balance' },
  { icon: '🌀', text: 'Irregular sadhana' },
  { icon: '📱', text: 'Digital distraction' },
  { icon: '🔥', text: 'Loss of enthusiasm' },
  { icon: '🧭', text: 'No accountability or guidance' },
];

const SADHANA_TRACKS = [
  'Japa rounds & quality',
  'Morning program attendance',
  'Scripture reading',
  'Shloka memorization',
  'Prayers & reflections',
  'Temple visit',
  'Kirtana participation',
  'Service activities',
  'Hearing classes',
  'Cleanliness & deity worship',
  'Ekadasi observance',
  'Association with devotees',
  'Sleep & discipline habits',
];

const HEALTH_SCORE_POINTS = [
  'Areas of strength',
  'Areas needing attention',
  'Consistency patterns',
  'Growth trends',
  'Lifestyle balance',
];

const GUIDED_GROWTH_FEATURES = [
  'Habit-building reminders',
  'Weekly goals',
  'Personalized encouragement',
  'Reflection prompts',
  'Accountability system',
  'Mentor review options',
  'Progress milestones',
  'Thematic growth plans',
];

const STUDY_TRACKS = [
  'Bhakti Sastri progress',
  'Bhakti Vaibhava studies',
  'Small books completion',
  'Daily reading targets',
  'Verse memorization',
  'Lecture hearing',
  'Notes & realizations',
];

const WISDOM_SOURCES = [
  'Bhagavad-gita',
  'Srimad Bhagavatam',
  'The teachings of great acharyas',
  'Principles of devotional lifestyle and Sadhana',
];

const SPIRITUAL_QUALITIES = [
  'Compassion',
  'Humility',
  'Self-control',
  'Cleanliness',
  'Steadiness',
  'Simplicity',
  'Devotional absorption',
];

const KEY_FEATURES = [
  { icon: '✅', text: 'Daily check-in system' },
  { icon: '📊', text: 'Spiritual analytics dashboard' },
  { icon: '🔥', text: 'Streaks & consistency tracking' },
  { icon: '🎯', text: 'Goal-based growth plans' },
  { icon: '🤝', text: 'Mentor connection' },
  { icon: '🔔', text: 'Notifications & reminders' },
  { icon: '📓', text: 'Reflection journal' },
  { icon: '🎉', text: 'Event participation tracking' },
  { icon: '📚', text: 'Study planner' },
  { icon: '🏆', text: 'Awards & milestone system' },
  { icon: '🌐', text: 'Multi-language support' },
  { icon: '🛕', text: 'Community engagement tools' },
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
      console.error('Failed to copy!', err);
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

function TrackList({ items }) {
  return (
    <ul className="track-list">
      {items.map((item) => (
        <li key={item} className="track-item">
          <span className="track-dot">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionDivider() {
  return <div className="section-divider" aria-hidden="true" />;
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
            <img src={appLogo} alt="Spiritual Health Coach Logo" className="nav-logo" />
            <span className="nav-title">Spiritual Health Coach</span>
          </div>
          <a href="#donate" className="btn-nav">Support Us</a>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <main className="hero-section">
        <div className="hero-content">
          <div className="pill-badge fade-in-up delay-1">
            <span className="pill-dot pulse"></span>
            <span className="pill-text">My Spiritual Assistant</span>
          </div>

          <h1 className="hero-heading fade-in-up delay-2">
            Transform Your Spiritual Life<br />
            <span className="text-gradient">with a Personal Sadhana Companion</span>
          </h1>

          <h2 className="hero-subheading fade-in-up delay-3">
            Spiritual Health Coach
          </h2>

          <p className="hero-description fade-in-up delay-3">
            A complete spiritual growth and accountability platform designed to help practitioners build
            consistency, purity, discipline, learning, and devotional happiness in daily life.
          </p>

          <p className="hero-tagline fade-in-up delay-3">
            Whether you are a beginner, practicing devotee, mentor, preacher, student, or spiritual
            seeker — <strong>Spiritual Health Coach</strong> helps you track, improve, and nourish your
            inner life systematically.
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
        <SectionDivider />
        <div className="section-header">
          <h4 className="section-subtitle">THE CHALLENGE</h4>
          <h2 className="section-title">Why Spiritual Health Matters</h2>
          <p className="section-desc">
            In today's fast-moving world, maintaining spiritual focus is difficult. We often struggle with:
          </p>
        </div>

        <div className="struggle-grid">
          {STRUGGLES.map((item) => (
            <div className="struggle-card glass-panel" key={item.text}>
              <div className="struggle-icon">{item.icon}</div>
              <p>{item.text}</p>
            </div>
          ))}
        </div>

        <p className="problem-cta-text">
          <strong>Spiritual Health Coach</strong> is designed to bring structure, inspiration, and
          guidance to your spiritual journey.
        </p>
      </section>

      {/* ── Features Section ── */}
      <section className="section features-section" id="features">
        <SectionDivider />
        <div className="section-header">
          <h4 className="section-subtitle">CORE MODULES</h4>
          <h2 className="section-title">What the App Helps You Track</h2>
        </div>

        <div className="features-grid">
          {/* Daily Sadhana */}
          <div className="feature-card glass-panel" id="feature-sadhana">
            <div className="feature-card-header">
              <div className="bento-icon-wrapper blue">📅</div>
              <div>
                <h3>Daily Sadhana Tracking</h3>
                <p className="feature-card-sub">Build consistency through simple and meaningful daily check-ins.</p>
              </div>
            </div>
            <p className="feature-track-label">Track:</p>
            <TrackList items={SADHANA_TRACKS} />
          </div>

          {/* Spiritual Health Score */}
          <div className="feature-card glass-panel" id="feature-score">
            <div className="feature-card-header">
              <div className="bento-icon-wrapper purple">📊</div>
              <div>
                <h3>Spiritual Health Score</h3>
                <p className="feature-card-sub">Get a weekly and monthly overview of your spiritual life through intelligent analytics.</p>
              </div>
            </div>
            <p className="feature-track-label">The app helps you identify:</p>
            <TrackList items={HEALTH_SCORE_POINTS} />
            <p className="feature-card-note">
              A personalized <strong>"Spiritual Health Score"</strong> motivates steady progress without
              comparison or pressure.
            </p>
          </div>

          {/* Guided Growth */}
          <div className="feature-card glass-panel" id="feature-growth">
            <div className="feature-card-header">
              <div className="bento-icon-wrapper green">🌱</div>
              <div>
                <h3>Guided Growth System</h3>
                <p className="feature-card-sub">The app is not just a tracker, it acts like a spiritual mentor.</p>
              </div>
            </div>
            <p className="feature-track-label">Features include:</p>
            <TrackList items={GUIDED_GROWTH_FEATURES} />
          </div>

          {/* Study Dashboard */}
          <div className="feature-card glass-panel" id="feature-study">
            <div className="feature-card-header">
              <div className="bento-icon-wrapper orange">📚</div>
              <div>
                <h3>Study & Learning Dashboard</h3>
                <p className="feature-card-sub">Designed especially for serious practitioners and students.</p>
              </div>
            </div>
            <p className="feature-track-label">Track:</p>
            <TrackList items={STUDY_TRACKS} />
          </div>
        </div>
      </section>

      {/* ── Wisdom Section ── */}
      <section className="section wisdom-section" id="wisdom">
        <SectionDivider />
        <div className="wisdom-container glass-panel">
          <div className="section-header" style={{ marginBottom: '2.5rem' }}>
            <h4 className="section-subtitle">FOUNDATION</h4>
            <h2 className="section-title">Based on Timeless Spiritual Wisdom</h2>
          </div>

          <div className="wisdom-grid">
            <div className="wisdom-col">
              <h4 className="wisdom-col-title">The app is inspired by the teachings of:</h4>
              <TrackList items={WISDOM_SOURCES} />
            </div>
            <div className="wisdom-divider-v" aria-hidden="true" />
            <div className="wisdom-col">
              <h4 className="wisdom-col-title">Special growth models aligned with spiritual qualities such as:</h4>
              <TrackList items={SPIRITUAL_QUALITIES} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Audience Section ── */}
      <section className="section audience-section" id="audience">
        <SectionDivider />
        <div className="section-header">
          <h4 className="section-subtitle">WHO IT'S FOR</h4>
          <h2 className="section-title">For Individuals, Mentors & Communities</h2>
        </div>

        <div className="audience-container">
          <div className="audience-item">
            <div className="audience-avatar">🧘‍♂️</div>
            <h4>Individual Practitioners</h4>
            <p>Develop strong habits and personal discipline.</p>
          </div>
          <div className="audience-item">
            <div className="audience-avatar">🤝</div>
            <h4>Mentors & Counselors</h4>
            <p>Guide students effectively with meaningful insights.</p>
          </div>
          <div className="audience-item">
            <div className="audience-avatar">🛕</div>
            <h4>Temples & Spiritual Communities</h4>
            <p>Encourage participation, learning, accountability, and engagement.</p>
          </div>
          <div className="audience-item">
            <div className="audience-avatar">👨‍👩‍👧‍👦</div>
            <h4>Families & Youth</h4>
            <p>Create healthy spiritual routines together.</p>
          </div>
        </div>
      </section>

      {/* ── Key Features Section ── */}
      <section className="section key-features-section" id="key-features">
        <SectionDivider />
        <div className="section-header">
          <h4 className="section-subtitle">AT A GLANCE</h4>
          <h2 className="section-title">Key Features</h2>
        </div>

        <div className="key-features-grid">
          {KEY_FEATURES.map((f) => (
            <div className="key-feature-pill glass-panel" key={f.text}>
              <span className="key-feature-icon">{f.icon}</span>
              <span className="key-feature-text">{f.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── More Than an App Section ── */}
      <section className="section cta-section" id="more">
        <SectionDivider />
        <div className="cta-container glass-panel">
          <div className="cta-content">
            <h4 className="section-subtitle">OUR MISSION</h4>
            <h2 className="cta-title">More Than an App</h2>
            <p className="cta-desc">
              Spiritual Health Coach is an effort to combine timeless wisdom with modern technology —
              helping sincere seekers live with greater awareness, discipline, purpose, and devotion.
            </p>
            <p className="cta-highlight">
              Small daily improvements create lifelong transformation.
            </p>

            <div className="cta-divider" aria-hidden="true" />

            <h3 className="cta-begin-title">Begin Your Journey</h3>
            <div className="cta-steps">
              <div className="cta-step">
                <span className="cta-step-icon">📿</span>
                <span>Track your practice.</span>
              </div>
              <div className="cta-step">
                <span className="cta-step-icon">💪</span>
                <span>Strengthen your habits.</span>
              </div>
              <div className="cta-step">
                <span className="cta-step-icon">✨</span>
                <span>Stay inspired.</span>
              </div>
              <div className="cta-step">
                <span className="cta-step-icon">🌱</span>
                <span>Grow spiritually — one day at a time.</span>
              </div>
            </div>

            <a href="#donate" className="btn-primary cta-btn">
              Support the Project
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── Donate Section ── */}
      <section className="section donate-section" id="donate">
        <SectionDivider />
        <div className="donate-container glass-panel">
          <div className="donate-content">
            <h2 className="donate-title">Support The Project</h2>
            <p className="donate-desc">
              Spiritual Health Coach is an effort to combine timeless wisdom with modern technology.
              Small daily improvements create lifelong transformation. Support the development of this
              app by contributing below.
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
            <span>Spiritual Health Coach</span>
          </div>
          <p className="footer-mantra">Your companion for conscious spiritual growth.</p>
          <div className="footer-copyright">
            © {new Date().getFullYear()} Spiritual Health Coach. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
