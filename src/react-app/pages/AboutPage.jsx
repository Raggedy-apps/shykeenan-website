import { useHtmlContent } from '../hooks/useHtmlContent.js';

export default function AboutPage() {
  const { loading, error, content } = useHtmlContent(
    '/data/imported/shykeenan_clone/about.html'
  );

  return (
    <section className="react-admin-card">
      <h2>About Shy Keenan</h2>
      {loading ? <p>Loading…</p> : null}
      {error ? <p className="react-admin-error">{error}</p> : null}
      {!loading && !error ? (
        <article
          className="react-admin-html"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : null}
    </section>
  );
}
