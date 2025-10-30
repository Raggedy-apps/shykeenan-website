import { useCallback, useEffect, useMemo, useState } from 'react';
import { PERMISSIONS } from '../../js/authorization.js';
import ImportExportPanel from '../components/ImportExportPanel.jsx';
import PinCard from '../components/PinCard.jsx';
import PinEditor from '../components/PinEditor.jsx';
import {
  PinGridSkeleton,
  TagSummarySkeleton,
  TimelineSkeleton,
} from '../components/SkeletonLoader.jsx';
import TagSummary from '../components/TagSummary.jsx';
import TimelineList from '../components/TimelineList.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { getDataApi } from '../dataApi.js';
import { sanitizeText } from '../utils/sanitization.js';

const ITEMS_PER_PAGE = 10;

// Default to canonical dataApi if not provided
const defaultDataApi = getDataApi();
export default function MemoriesPage({ dataApi = defaultDataApi }) {
  const {
    pins,
    timeline,
    tagSummary,
    loading,
    error,
    createPin,
    updatePin,
    deletePin,
    importJson,
    importCsv,
    exportJson,
    exportCsv,
    reset,
  } = dataApi;
  const { hasPermission } = useAdmin();
  const canEdit = hasPermission(PERMISSIONS.EDIT_POST);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState('');
  const [statusTone, setStatusTone] = useState('info');

  useEffect(() => {
    if (!status) return undefined;
    const timer = setTimeout(() => {
      setStatus('');
      setStatusTone('info');
    }, 4000);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pins]);

  const filteredPins = useMemo(() => {
    const term = search.trim().toLowerCase();
    return pins.filter(pin => {
      const matchesSearch = term
        ? (pin.title || '').toLowerCase().includes(term) ||
          (pin.desc || '').toLowerCase().includes(term) ||
          (Array.isArray(pin.tags)
            ? pin.tags.some(tag => (tag || '').toLowerCase().includes(term))
            : false)
        : true;
      const matchesTag = activeTag ? Array.isArray(pin.tags) && pin.tags.includes(activeTag) : true;
      return matchesSearch && matchesTag;
    });
  }, [pins, search, activeTag]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPins.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPins = filteredPins.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
    // Scroll to top of pin grid
    const pinGrid = document.querySelector('.pin-grid');
    if (pinGrid) {
      pinGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const announce = (message, tone = 'info') => {
    setStatus(message);
    setStatusTone(tone);
  };

  const handleImportJson = async file => {
    try {
      await importJson(file);
      announce(`Imported ${file.name}`, 'success');
    } catch (err) {
      announce(`JSON import failed: ${err.message}`, 'error');
    }
  };

  const handleImportCsv = async file => {
    try {
      await importCsv(file);
      announce(`Imported ${file.name}`, 'success');
    } catch (err) {
      announce(`CSV import failed: ${err.message}`, 'error');
    }
  };

  const handleExportJson = () => {
    exportJson();
    announce('Exported memories JSON', 'success');
  };

  const handleExportCsv = () => {
    exportCsv();
    announce('Exported memories CSV', 'success');
  };

  const handleReset = () => {
    setSelected(null);
    reset();
    announce('Restored source data', 'info');
  };

  return (
    <div className="memories-grid">
      <div className="memories-main">
        <section className="react-admin-card">
          <div className="memories-toolbar">
            <label htmlFor="memories-search" className="visually-hidden">
              Search memories
            </label>
            <input
              id="memories-search"
              type="search"
              value={search}
              placeholder="Search memories…"
              onChange={event => {
                setSearch(sanitizeText(event.target.value));
                resetPagination();
              }}
            />
            <span className="react-admin-muted" role="status">
              {filteredPins.length} of {pins.length} memories
            </span>
          </div>
          {status ? (
            <p
              className={
                statusTone === 'error'
                  ? 'react-admin-error'
                  : statusTone === 'success'
                    ? 'react-admin-success'
                    : 'react-admin-muted'
              }
              role="status"
            >
              {status}
            </p>
          ) : null}
          {loading && !pins.length ? (
            <TagSummarySkeleton />
          ) : (
            <TagSummary
              tagSummary={tagSummary}
              onSelect={tag => {
                setActiveTag(tag);
                resetPagination();
              }}
              activeTag={activeTag}
            />
          )}
        </section>

        <section className="pin-grid" aria-live="polite">
          {loading && !pins.length ? <PinGridSkeleton count={ITEMS_PER_PAGE} /> : null}
          {error ? <p className="react-admin-error">{error}</p> : null}
          {!loading && !filteredPins.length ? (
            <p className="react-admin-muted">No memories match the current filters.</p>
          ) : null}
          {!loading && paginatedPins.length ? (
            <>
              <div className="pin-grid-content">
                {paginatedPins.map(pin => (
                  <PinCard
                    key={pin.id}
                    pin={pin}
                    onSelect={canEdit ? setSelected : () => {}}
                    isSelected={selected?.id === pin.id}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 ? (
                <nav className="pagination" aria-label="Pagination navigation">
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    ← Previous
                  </button>

                  <div className="pagination-info">
                    <span className="pagination-text">
                      Page {currentPage} of {totalPages}
                    </span>
                    <span className="pagination-stats">
                      ({startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredPins.length)}{' '}
                      of {filteredPins.length})
                    </span>
                  </div>

                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    Next →
                  </button>
                </nav>
              ) : null}
            </>
          ) : null}
        </section>
      </div>

      <aside className="memories-sidebar">
        <ImportExportPanel
          onImportJson={handleImportJson}
          onImportCsv={handleImportCsv}
          onExportJson={handleExportJson}
          onExportCsv={handleExportCsv}
          onReset={handleReset}
        />

        <section className="react-admin-card">
          <h2>Timeline</h2>
          {loading && !pins.length ? <TimelineSkeleton /> : <TimelineList timeline={timeline} />}
        </section>

        {canEdit ? (
          <PinEditor
            selectedPin={selected}
            onSave={pin => {
              updatePin(pin);
              announce(`Updated “${pin.title}”`, 'success');
              setSelected(null);
            }}
            onDelete={id => {
              deletePin(id);
              announce('Memory deleted', 'info');
              setSelected(null);
            }}
            onCreate={pin => {
              createPin(pin);
              announce('Memory created', 'success');
              setSelected(null);
            }}
          />
        ) : (
          <p className="react-admin-muted">Sign in with edit permission to add or edit memories.</p>
        )}
      </aside>
    </div>
  );
}
