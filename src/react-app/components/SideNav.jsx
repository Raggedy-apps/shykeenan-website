import { useTheme } from '../context/ThemeContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function SideNav({ pages, activePage, onNavigate, stats }) {
  const { isNeon, isDark } = useTheme();
  const themeStatus = isDark
    ? 'Dark mode active'
    : isNeon
      ? 'Neon glow active'
      : 'Standard theme';

  return (
    <nav className="react-admin-sidenav" aria-label="Admin navigation">
      <header className="react-admin-sidenav__header">
        <div>
          <p className="react-admin-title">ShyKeenan Admin</p>
          <p className="react-admin-subtitle">Operations console</p>
        </div>
        <ThemeToggle variant="cycle-dark" />
      </header>
      <section
        className="react-admin-sidenav__status"
        aria-live="polite"
        aria-label="System status"
      >
        <span className="status-pill" data-status="online">
          <span className="status-indicator" aria-hidden="true" />
          <span>Systems online</span>
        </span>
        <p className="react-admin-muted">
          Active theme: <strong>{themeStatus}</strong>
        </p>
      </section>
      <dl className="react-admin-stats" aria-label="Dataset summary">
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
      <section aria-labelledby="react-admin-nav-heading">
        <h2
          id="react-admin-nav-heading"
          className="react-admin-sidenav__section"
        >
          Navigate
        </h2>
        <ul role="list">
          {pages.map((page) => (
            <li key={page.id}>
              <button
                type="button"
                className={page.id === activePage ? 'active' : ''}
                onClick={() => onNavigate(page.id)}
                aria-current={page.id === activePage ? 'page' : undefined}
                aria-describedby={`page-description-${page.id}`}
              >
                {page.label}
              </button>
              <div
                id={`page-description-${page.id}`}
                className="visually-hidden"
              >
                Navigate to {page.label} page
              </div>
            </li>
          ))}
        </ul>
      </section>
    </nav>
  );
}
