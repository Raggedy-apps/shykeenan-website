import { useEffect, useState } from 'react';

export default function TraumaAwareToggle({ className = '' }) {
  // Use localStorage to persist trauma-aware mode
  const [traumaAware, setTraumaAware] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('traumaAware') === 'true';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (traumaAware) {
        document.body.classList.add('trauma-aware');
      } else {
        document.body.classList.remove('trauma-aware');
      }
      localStorage.setItem('traumaAware', traumaAware ? 'true' : 'false');
    }
  }, [traumaAware]);

  return (
    <button
      type="button"
      className={`trauma-aware-toggle ${className}`}
      aria-pressed={traumaAware}
      aria-label={traumaAware ? 'Disable trauma-aware mode' : 'Enable trauma-aware mode'}
      title={traumaAware ? 'Disable trauma-aware mode' : 'Enable trauma-aware mode'}
      onClick={() => setTraumaAware((v) => !v)}
      style={{ position: 'absolute', right: 8, top: 8, opacity: 0.5, zIndex: 1000 }}
    >
      <span aria-hidden="true" style={{ fontSize: '1.2em' }}>{traumaAware ? '🧘‍♂️' : '🧘'}</span>
      <span className="visually-hidden">{traumaAware ? 'Disable trauma-aware mode' : 'Enable trauma-aware mode'}</span>
    </button>
  );
}
