import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle({ variant = 'icon' }) {
  const { isNeon, isDark, toggleTheme, setTheme } = useTheme();

  const handleClick = () => {
    if (variant === 'cycle-dark') {
      const next = isDark ? '' : 'dark';
      setTheme(next);
    } else {
      toggleTheme();
    }
  };

  const statusLabel = isDark
    ? 'Dark mode'
    : isNeon
      ? 'Neon mode'
      : 'Standard mode';
  const buttonLabel = isDark
    ? 'Disable dark mode'
    : isNeon
      ? 'Disable neon mode'
      : 'Enable neon mode';

  return (
    <button
      type="button"
      className={`theme-toggle theme-toggle--${variant}`}
      onClick={handleClick}
      aria-pressed={isNeon || isDark}
      aria-label={buttonLabel}
      title={buttonLabel}
    >
      <span aria-hidden="true" className="theme-toggle-icon">
        {isDark ? '🌙' : isNeon ? '💡' : '☀️'}
      </span>
      <span className="theme-toggle-label">{statusLabel}</span>
    </button>
  );
}
