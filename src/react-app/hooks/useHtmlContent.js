import { useEffect, useState } from 'react';

function sanitizeFragment(html) {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('script').forEach((node) => node.remove());
  doc
    .querySelectorAll('[style]')
    .forEach((node) => node.removeAttribute('style'));
  const main =
    doc.querySelector('#content') || doc.querySelector('main') || doc.body;
  return main ? main.innerHTML : '';
}

export function useHtmlContent(path) {
  const [state, setState] = useState({ loading: true, error: '', content: '' });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setState({ loading: true, error: '', content: '' });
      try {
        const response = await fetch(path, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Failed to fetch ${path}`);
        const text = await response.text();
        const content = sanitizeFragment(text);
        if (!cancelled) {
          setState({ loading: false, error: '', content });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            loading: false,
            error: err.message || 'Unable to load content.',
            content: '',
          });
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}
