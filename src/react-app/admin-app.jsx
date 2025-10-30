import { createRoot } from 'react-dom/client';
import App from './App.jsx';

function mount() {
  const container = document.getElementById('react-root');
  if (!container) {
    throw new Error('Admin root element #react-root not found');
  }

  const root = createRoot(container);
  root.render(<App />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
