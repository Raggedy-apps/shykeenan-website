import { useEffect, useState } from 'react';
import { sanitizeHtml, sanitizeText, sanitizeUrl } from '../utils/sanitization.js';

const EMPTY_PIN = {
  id: null,
  title: '',
  desc: '',
  date: new Date().toISOString().slice(0, 10),
  tags: [],
  image: '',
  video: '',
};

export default function PinEditor({ selectedPin, onSave, onDelete, onCreate }) {
  const [form, setForm] = useState(EMPTY_PIN);
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

  useEffect(() => {
    if (selectedPin) {
      setForm({
        ...selectedPin,
        tags: selectedPin.tags.join(', '),
      });
    } else {
      setForm(EMPTY_PIN);
    }
  }, [selectedPin]);

const getSanitizedValue = (name, value) => {
  switch (name) {
    case 'title':
    case 'date':
      return sanitizeText(value);
    case 'desc':
      return sanitizeHtml(value);
    case 'tags':
      return sanitizeText(value);
    case 'image':
    case 'video':
      return sanitizeUrl(value);
    default:
      return value;
  }
};
  const handleChange = event => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: getSanitizedValue(name, value) }));
  // Validate date
  if (!isValidDate(sanitizedPayload.date)) {
    alert('Invalid date format. Please use YYYY-MM-DD.');
    return;
  }

  // Sanitize individual tags
  sanitizedPayload.tags = sanitizedPayload.tags.map(tag => sanitizeText(tag)).filter(Boolean);

  // Limit tags to prevent abuse
  if (sanitizedPayload.tags.length > 20) {
    sanitizedPayload.tags = sanitizedPayload.tags.slice(0, 20);
  }
  };

  const parsedTags = raw =>
    raw
      .split(/[,;]+/)
      .map(tag => tag.trim())
      .filter(Boolean);

  const handleSubmit = event => {
    event.preventDefault();
    const sanitizedPayload = {
      ...selectedPin,
      ...form,
      title: sanitizeText(form.title),
      desc: sanitizeHtml(form.desc),
      tags: parsedTags(form.tags ?? ''),
      date: sanitizeText(form.date),
      image: sanitizeUrl(form.image),
      video: sanitizeUrl(form.video),
    };
    if (sanitizedPayload.id) {
      onSave(sanitizedPayload);
    } else {
      onCreate(sanitizedPayload);
      setForm(EMPTY_PIN);
    }
  };

  const handleDelete = () => {
    if (selectedPin && selectedPin.id) {
      onDelete(selectedPin.id);
    }
  };

  return (
    <section className="react-admin-card">
      <h2>{selectedPin ? 'Edit memory' : 'Create memory'}</h2>
      <form className="react-admin-form" onSubmit={handleSubmit}>
        <label htmlFor="pin-title">Title</label>
        <input id="pin-title" name="title" value={form.title} onChange={handleChange} required />

        <label htmlFor="pin-date">Date</label>
        <input
          id="pin-date"
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
        />

        <label htmlFor="pin-desc">Description</label>
        <textarea
          id="pin-desc"
          name="desc"
          value={form.desc}
          onChange={handleChange}
          rows={5}
          required
        />

        <label htmlFor="pin-tags">Tags (comma or semicolon separated)</label>
        <input id="pin-tags" name="tags" value={form.tags} onChange={handleChange} />

        <label htmlFor="pin-image">Image URL</label>
        <input id="pin-image" name="image" value={form.image} onChange={handleChange} />

        <label htmlFor="pin-video">Video embed URL</label>
        <input id="pin-video" name="video" value={form.video} onChange={handleChange} />

        <div className="react-admin-inline">
          <button type="submit" className="primary">
            {selectedPin ? 'Save changes' : 'Create memory'}
          </button>
          {selectedPin ? (
            <button type="button" className="danger" onClick={handleDelete}>
              Delete
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
