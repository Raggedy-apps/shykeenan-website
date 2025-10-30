import { useEffect, useState } from 'react';
import AdminGate from '../components/AdminGate.jsx';
import PhoenixSystemPanel from '../components/PhoenixSystemPanel.jsx';
import { getDataApi } from '../dataApi.js';

function TimelineEditor({ draft, onSave, onReset }) {
  const initialDraft = Array.isArray(draft) ? draft : [];
  const [local, setLocal] = useState(initialDraft.slice());
  const [newEntry, setNewEntry] = useState({ date: '', desc: '' });

  useEffect(() => {
    setLocal(Array.isArray(draft) ? draft.slice() : []);
  }, [draft]);

  const updateEntry = (index, field, value) => {
    setLocal(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addEntry = () => {
    if (!newEntry.date || !newEntry.desc) return;
    setLocal(prev => [...prev, newEntry]);
    setNewEntry({ date: '', desc: '' });
  };

  const handleReset = () => {
    setLocal(draft.slice());
    setNewEntry({ date: '', desc: '' });
    onReset();
  };

  return (
    <section className="react-admin-card" aria-labelledby="timeline-editor-heading">
      <h2 id="timeline-editor-heading">Timeline editor</h2>
      {!local.length ? (
        <p className="react-admin-muted" role="status">
          No timeline entries yet.
        </p>
      ) : null}
      <ul className="timeline-editor" role="list" aria-label="Timeline entries">
        {local.map((entry, index) => (
          <li key={`${entry.date}-${index}`} role="listitem">
            <label htmlFor={`entry-date-${index}`} className="visually-hidden">
              Timeline entry {index + 1} date
            </label>
            <input
              id={`entry-date-${index}`}
              type="date"
              value={entry.date}
              onChange={event => updateEntry(index, 'date', sanitizeText(event.target.value))}
              aria-label={`Timeline entry ${index + 1} date`}
              aria-describedby={`entry-desc-${index} entry-remove-${index}`}
            />
            <label htmlFor={`entry-desc-${index}`} className="visually-hidden">
              Timeline entry {index + 1} description
            </label>
            <input
              id={`entry-desc-${index}`}
              type="text"
              value={entry.desc}
              onChange={event => updateEntry(index, 'desc', sanitizeText(event.target.value))}
              aria-label={`Timeline entry ${index + 1} description`}
            />
            <button
              id={`entry-remove-${index}`}
              type="button"
              className="ghost"
              onClick={() => setLocal(prev => prev.filter((_, idx) => idx !== index))}
              aria-label={`Remove timeline entry ${index + 1}: ${entry.desc}`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <fieldset className="react-admin-inline">
        <legend className="visually-hidden">Add new timeline entry</legend>
        <label htmlFor="new-entry-date" className="visually-hidden">
          New timeline date
        </label>
        <input
          id="new-entry-date"
          type="date"
          value={newEntry.date}
          onChange={event => setNewEntry(prev => ({ ...prev, date: event.target.value }))}
          placeholder="YYYY-MM-DD"
          aria-label="New timeline date"
          aria-describedby="add-entry-button"
        />
        <label htmlFor="new-entry-desc" className="visually-hidden">
          New timeline description
        </label>
        <input
          id="new-entry-desc"
          type="text"
          value={newEntry.desc}
          onChange={event => setNewEntry(prev => ({ ...prev, desc: event.target.value }))}
          placeholder="Description"
          aria-label="New timeline description"
          aria-describedby="add-entry-button"
        />
        <button
          id="add-entry-button"
          type="button"
          onClick={addEntry}
          className="ghost"
          disabled={!newEntry.date || !newEntry.desc}
          aria-describedby="new-entry-date new-entry-desc"
        >
          Add entry
        </button>
      </fieldset>
      <div className="react-admin-inline" role="group" aria-label="Timeline actions">
        <button
          type="button"
          className="primary"
          onClick={() => onSave(local)}
          disabled={local.length === 0}
          aria-describedby="save-status"
        >
          Save timeline
        </button>
        <button type="button" className="ghost" onClick={handleReset}>
          Reset changes
        </button>
      </div>
      <div id="save-status" className="visually-hidden" aria-live="polite" aria-atomic="true">
        Timeline saved successfully
      </div>
    </section>
  );
}

function ConnectionList({ connections, pins }) {
  if (!connections?.length) {
    return <p className="react-admin-muted">No pin connections defined.</p>;
  }
  const lookup = new Map((pins ?? []).map(pin => [pin.id, pin.title]));
  return (
    <ul className="connection-list">
      {connections.map(conn => (
        <li key={`${conn.from}-${conn.to}`}>
          <span>{lookup.get(conn.from) || conn.from}</span>
          <span aria-hidden="true">→</span>
          <span>{lookup.get(conn.to) || conn.to}</span>
        </li>
      ))}
    </ul>
  );
}

// Default to canonical dataApi if not provided
const defaultDataApi = getDataApi();
export default function AdminPage({ dataApi = defaultDataApi }) {
  const { pins, timeline, connections, setTimelineEntries, reset } = dataApi;

  return (
    <AdminGate>
      <div aria-live="polite" aria-atomic="false">
        {/* Phoenix System Panel */}
        <PhoenixSystemPanel />

        <section className="react-admin-card" aria-labelledby="dataset-snapshot-heading">
          <h2 id="dataset-snapshot-heading">Dataset snapshot</h2>
          <dl className="react-admin-stats" role="list" aria-label="Dataset statistics">
            <div role="listitem">
              <dt id="pins-count-label">Pins</dt>
              <dd aria-labelledby="pins-count-label">{pins.length}</dd>
            </div>
            <div role="listitem">
              <dt id="timeline-count-label">Timeline entries</dt>
              <dd aria-labelledby="timeline-count-label">{timeline.length}</dd>
            </div>
            <div role="listitem">
              <dt id="connections-count-label">Connections</dt>
              <dd aria-labelledby="connections-count-label">{connections.length}</dd>
            </div>
          </dl>
          <p className="react-admin-muted" role="status" aria-live="polite">
            All changes remain client-side until exported. Importing the JSON file in production
            will reproduce your edits.
          </p>
        </section>

        <TimelineEditor
          draft={timeline}
          onSave={entries => setTimelineEntries(entries)}
          onReset={reset}
        />

        <section className="react-admin-card" aria-labelledby="connections-heading">
          <h2 id="connections-heading">Connections</h2>
          <ConnectionList connections={connections} pins={pins} />
          <p className="react-admin-muted" role="note">
            Connection editing is coming soon. For now, edit the JSON export to adjust the graph.
          </p>
        </section>
      </div>
    </AdminGate>
  );
}
