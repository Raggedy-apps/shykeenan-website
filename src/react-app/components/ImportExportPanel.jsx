import { useRef } from 'react';
import { PERMISSIONS } from '../../js/authorization.js';
import { useAdmin } from '../context/AdminContext.jsx';

export default function ImportExportPanel({
  onImportJson,
  onImportCsv,
  onExportJson,
  onExportCsv,
  onReset,
}) {
  const { hasPermission } = useAdmin();
  const canImport = hasPermission(PERMISSIONS.UPLOAD_MEDIA);
  const jsonInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const handleJsonSelect = event => {
    const file = event.target.files?.[0];
    if (file) onImportJson(file);
    event.target.value = '';
  };

  const handleCsvSelect = event => {
    const file = event.target.files?.[0];
    if (file) onImportCsv(file);
    event.target.value = '';
  };

  return (
    <section className="react-admin-card" aria-labelledby="dataset-tools-heading">
      <h2 id="dataset-tools-heading">Dataset tools</h2>
      <fieldset className="react-admin-inline">
        <legend className="visually-hidden">Export options</legend>
        <button type="button" onClick={onExportJson} aria-describedby="export-json-desc">
          Export JSON
        </button>
        <div id="export-json-desc" className="visually-hidden">
          Export all memories and timeline data as a JSON file
        </div>
        <button type="button" onClick={onExportCsv} aria-describedby="export-csv-desc">
          Export CSV
        </button>
        <div id="export-csv-desc" className="visually-hidden">
          Export memories data as a CSV file
        </div>
        <button type="button" onClick={onReset} aria-describedby="reset-desc">
          Reset to source
        </button>
        <div id="reset-desc" className="visually-hidden">
          Reset all data to the original source state
        </div>
      </fieldset>
      <fieldset className="react-admin-inline">
        <legend className="visually-hidden">Import options</legend>
        <button
          type="button"
          disabled={!canImport}
          onClick={() => jsonInputRef.current?.click()}
          aria-describedby={!canImport ? 'import-disabled-desc' : 'import-json-desc'}
        >
          Import JSON
        </button>
        <div id="import-json-desc" className="visually-hidden">
          Import memories and timeline data from a JSON file
        </div>
        <button
          type="button"
          disabled={!canImport}
          onClick={() => csvInputRef.current?.click()}
          aria-describedby={!canImport ? 'import-disabled-desc' : 'import-csv-desc'}
        >
          Import CSV
        </button>
        <div id="import-csv-desc" className="visually-hidden">
          Import memories data from a CSV file
        </div>
      </fieldset>
      {!canImport ? (
        <p id="import-disabled-desc" className="react-admin-muted" role="note">
          Unlock upload permission to import files or modify data.
        </p>
      ) : null}
      <input
        ref={jsonInputRef}
        type="file"
        accept="application/json"
        className="visually-hidden"
        onChange={handleJsonSelect}
        aria-label="Select JSON file to import"
      />
      <input
        ref={csvInputRef}
        type="file"
        accept="text/csv"
        className="visually-hidden"
        onChange={handleCsvSelect}
        aria-label="Select CSV file to import"
      />
    </section>
  );
}
