import PropTypes from 'prop-types';

export default function NotFoundPage({ unknownPage, onReset }) {
  return (
    <section className="react-admin-card" aria-labelledby="not-found-heading">
      <header>
        <h2 id="not-found-heading">Page not found</h2>
        <p className="react-admin-muted">
          {unknownPage ? (
            <>
              We couldn&apos;t load the page <strong>{unknownPage}</strong>. It
              may have been renamed or removed.
            </>
          ) : (
            <>The requested page is unavailable.</>
          )}
        </p>
      </header>
      <div className="react-admin-stack">
        <p>
          Use the navigation menu to access another section or return to the
          memories dashboard to continue working.
        </p>
        <button type="button" className="primary" onClick={onReset}>
          Go to Memories dashboard
        </button>
      </div>
    </section>
  );
}

NotFoundPage.propTypes = {
  unknownPage: PropTypes.string,
  onReset: PropTypes.func.isRequired,
};
