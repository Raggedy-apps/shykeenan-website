import { sanitizeHtml, sanitizeText } from '../utils/sanitization.js';
export default function TimelineList({ timeline }) {
  if (!timeline?.length) {
    return <p className="react-admin-muted">No timeline entries yet.</p>;
  }
  return (
    <ol className="timeline-list">
      {timeline
        .slice()
        .sort((a, b) => new Date(a.publishedDate) - new Date(b.publishedDate))
        .map(entry => (
          <li key={entry.timelineEventId || `${entry.publishedDate}-${entry.title}`.slice(0, 40)}>
            <time dateTime={entry.publishedDate}>{entry.publishedDate}</time>
            <strong>{sanitizeText(entry.title)}</strong>
            {entry.summary ? <div className="timeline-summary" dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.summary) }} /> : null}
          </li>
        ))}
    </ol>
  );
}
