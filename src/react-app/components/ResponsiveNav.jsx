import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import TraumaAwareToggle from './TraumaAwareToggle.jsx';

export default function ResponsiveNav({ pages, activePage, onNavigate, stats }) {
  const { isNeon, isDark } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const themeStatus = isDark
    ? 'Dark mode active'
    : isNeon
      ? 'Neon glow active'
      : 'Standard theme';

  // Close mobile menu when clicking outside or on nav item
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.responsive-nav')) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (isMobileMenuOpen && event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

  // Handle navigation and close mobile menu
  const handleNavigation = (pageId) => {
    onNavigate(pageId);
    setIsMobileMenuOpen(false);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="responsive-nav" aria-label="Main navigation">
      {/* Mobile Header */}
      <div className="responsive-nav__mobile-header">
        <div className="responsive-nav__brand">
          <h1 className="responsive-nav__title">ShyKeenan Admin</h1>
          <p className="responsive-nav__subtitle">Operations console</p>
        </div>

        <div className="responsive-nav__mobile-controls">
          <ThemeToggle variant="cycle-dark" />
          <button
            type="button"
            className="responsive-nav__hamburger"
            onClick={toggleMobileMenu}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label="Toggle navigation menu"
          >
            <span className="hamburger-line" aria-hidden="true"></span>
            <span className="hamburger-line" aria-hidden="true"></span>
            <span className="hamburger-line" aria-hidden="true"></span>
          </button>
        </div>
      </div>

      {/* Desktop Navigation Bar */}
      <div className="responsive-nav__desktop">
        <div className="responsive-nav__header">
          <div className="responsive-nav__brand">
            <h1 className="responsive-nav__title">ShyKeenan Admin</h1>
            <p className="responsive-nav__subtitle">Operations console</p>
          </div>
          <ThemeToggle variant="cycle-dark" />
        </div>

        <nav className="responsive-nav__main" aria-label="Main navigation">
          <ul className="responsive-nav__list" role="list">
            {pages.map((page) => (
              <li key={page.id}>
                <button
                  type="button"
                  className={`responsive-nav__item ${page.id === activePage ? 'active' : ''}`}
                  onClick={() => handleNavigation(page.id)}
                  aria-current={page.id === activePage ? 'page' : undefined}
                  aria-describedby={`nav-description-${page.id}`}
                >
                  {page.label}
                </button>
                <div
                  id={`nav-description-${page.id}`}
                  className="visually-hidden"
                >
                  Navigate to {page.label} page
                </div>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={`responsive-nav__mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}
        id="mobile-navigation"
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="responsive-nav__mobile-content">
          {/* System Status */}
          <section
            className="responsive-nav__status"
            aria-live="polite"
            aria-label="System status"
          >
            <span className="status-pill" data-status="online">
              <span className="status-indicator" aria-hidden="true" />
              <span>Systems online</span>
            </span>
            <p className="responsive-nav__theme-status">
              Active theme: <strong>{themeStatus}</strong>
            </p>
          </section>

          {/* Navigation Links */}
          <nav aria-labelledby="mobile-nav-heading">
            <h2
              id="mobile-nav-heading"
              className="responsive-nav__section-title"
            >
              Navigate
            </h2>
            <ul className="responsive-nav__mobile-list" role="list">
              {pages.map((page) => (
                <li key={page.id}>
                  <button
                    type="button"
                    className={`responsive-nav__mobile-item ${page.id === activePage ? 'active' : ''}`}
                    onClick={() => handleNavigation(page.id)}
                    aria-current={page.id === activePage ? 'page' : undefined}
                  >
                    {page.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Stats */}
          <section aria-labelledby="mobile-stats-heading">
            <h2
              id="mobile-stats-heading"
              className="responsive-nav__section-title"
            >
              Dataset Summary
            </h2>
            <dl className="responsive-nav__stats" aria-label="Dataset summary">
              <div>
                <dt>Pins</dt>
                <dd>{stats.pins}</dd>
              </div>
              <div>
                <dt>Timeline</dt>
                <dd>{stats.timeline}</dd>
              </div>
              <div>
                <dt>Connections</dt>
                <dd>{stats.connections}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="responsive-nav__overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      {/* Trauma Aware Toggle Button */}
      <TraumaAwareToggle />
    </nav>
  );
}