import { useHtmlContent } from '../hooks/useHtmlContent.js';

export default function ContactPage() {
  const { loading, error, content } = useHtmlContent(
    '/data/imported/shykeenan_clone/contact.html'
  );

  return (
    <section className="react-admin-card">
      <h2>Contact</h2>
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
