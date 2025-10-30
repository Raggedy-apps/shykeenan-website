import { sanitizeText } from '../utils/sanitization.js';
export default function PinCard({ pin, onSelect, isSelected }) {
  return (
    <article
      className={`pin-card ${isSelected ? 'selected' : ''}`}
      aria-labelledby={`pin-title-${pin.id || pin.title.replace(/\s+/g, '-').toLowerCase()}`}
      aria-describedby={`pin-desc-${pin.id || pin.title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <header>
        <h3
          id={`pin-title-${pin.id || pin.title.replace(/\s+/g, '-').toLowerCase()}`}
        >
          {sanitizeText(pin.title)}
        </h3>
        <time dateTime={pin.date} aria-label={`Created on ${pin.date}`}>
          {pin.date}
        </time>
      </header>
      <p
        id={`pin-desc-${pin.id || pin.title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        {sanitizeHtml(pin.desc)}
      </p>
      {pin.tags.length ? (
        <ul
          className="pin-tags"
          aria-label={`Tags for ${sanitizeText(pin.title)}: ${pin.tags.join(', ')}`}
        >
          {pin.tags.map((tag) => (
            <li key={tag} role="listitem">
              <span aria-label={`Tag: ${sanitizeText(tag)}`}>{sanitizeText(tag)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <footer>
        <button
          type="button"
          onClick={() => onSelect(pin)}
          aria-pressed={isSelected}
          aria-describedby={`edit-button-desc-${pin.id || pin.title.replace(/\s+/g, '-').toLowerCase()}`}
        >
          {isSelected ? 'Editing' : 'Edit'}
        </button>
        <div
          id={`edit-button-desc-${pin.id || pin.title.replace(/\s+/g, '-').toLowerCase()}`}
          className="visually-hidden"
        >
          {isSelected ? 'Currently editing this pin' : 'Edit this pin'}
        </div>
      </footer>
    </article>
  );
}
