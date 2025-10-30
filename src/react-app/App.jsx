import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { AdminProvider } from './context/AdminContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { useMemoriesData } from './hooks/useMemoriesData.js';
import { alertingSystem } from './utils/alertingSystem.js';
import { globalErrorHandler, reportError } from './utils/errorHandler.js';
import healthChecker from './utils/healthCheck.js';
import { initPerformanceMonitoring } from './utils/performance.js';
import { realTimeMonitor } from './utils/realTimeMonitor.js';
import { registerServiceWorker } from './utils/serviceWorker.js';

function PageLoader() {
  return (
    <div className="page-loader">
      <div className="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  );
}

// Lazy load page components for code splitting
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const BooksPage = lazy(() => import('./pages/BooksPage.jsx'));
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'));
const MemoriesPage = lazy(() => import('./pages/MemoriesPage.jsx'));
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'));
const DemoPage = lazy(() => import('./pages/DemoPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

const PAGES = [
  { id: 'memories', label: 'Memories' },
  { id: 'demo', label: '🌟 Demo Showcase' },
  { id: 'about', label: 'About' },
  { id: 'books', label: 'Books' },
  { id: 'contact', label: 'Contact' },
  { id: 'admin', label: 'Admin' },
];

const DEFAULT_PAGE = 'memories';
const NOT_FOUND_PAGE = 'not-found';
const PAGE_MAP = new Map(PAGES.map((page) => [page.id, page]));

const sanitizeHash = (hash) => {
  if (!hash) {
    return '';
  }
  const stripped = hash.startsWith('#') ? hash.slice(1) : hash;
  return stripped.replace(/^\/+/u, '').trim();
};

const resolveRouteFromHash = (hash) => {
  const cleaned = sanitizeHash(hash);
  if (!cleaned) {
    return { page: DEFAULT_PAGE, missingPage: null };
  }
  const normalized = cleaned.toLowerCase();
  if (PAGE_MAP.has(normalized)) {
    return { page: normalized, missingPage: null };
  }
  return { page: NOT_FOUND_PAGE, missingPage: cleaned };
};

export default function App() {
  const [route, setRoute] = useState(() => {
    if (typeof window === 'undefined') {
      return { page: DEFAULT_PAGE, missingPage: null };
    }
    return resolveRouteFromHash(window.location.hash);
  });
  const activePage = route.page;
  const missingPage = route.missingPage;
  const dataApi = useMemoriesData();

  // Register service worker and initialize performance monitoring
  useEffect(() => {
    registerServiceWorker();
    initPerformanceMonitoring();
    globalErrorHandler.init();
    realTimeMonitor.init();
    alertingSystem.init();
    healthChecker.startMonitoring();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    window.memoriesDataApi = dataApi;
    return () => {
      delete window.memoriesDataApi;
    };
  }, [dataApi]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleHashChange = () => {
      setRoute(resolveRouteFromHash(window.location.hash));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (activePage === NOT_FOUND_PAGE) {
      if (missingPage) {
        const targetHash = `#${missingPage}`;
        if (window.location.hash !== targetHash) {
          window.history.replaceState(null, '', targetHash);
        }
      }
      return;
    }
    const targetHash = `#${activePage}`;
    if (window.location.hash !== targetHash) {
      window.history.replaceState(null, '', targetHash);
    }
  }, [activePage, missingPage]);

  const handleNavigate = useCallback((targetId) => {
    if (typeof targetId !== 'string') {
      setRoute({ page: DEFAULT_PAGE, missingPage: null });
      return;
    }
    const candidate = targetId.trim();
    if (!candidate) {
      setRoute({ page: DEFAULT_PAGE, missingPage: null });
      return;
    }
    const normalized = candidate.toLowerCase();
    if (PAGE_MAP.has(normalized)) {
      setRoute({ page: normalized, missingPage: null });
      return;
    }
    setRoute({ page: NOT_FOUND_PAGE, missingPage: candidate });
  }, []);

  const pageComponent = useMemo(() => {
    switch (activePage) {
      case 'about':
        return <AboutPage />;
      case 'books':
        return <BooksPage />;
      case 'contact':
        return <ContactPage />;
      case 'demo':
        return <DemoPage />;
      case 'admin':
        return <AdminPage dataApi={dataApi} />;
      case NOT_FOUND_PAGE:
        return (
          <NotFoundPage
            unknownPage={missingPage}
            onReset={() => handleNavigate(DEFAULT_PAGE)}
          />
        );
      case 'memories':
      default:
        return <MemoriesPage dataApi={dataApi} />;
    }
  }, [activePage, dataApi, handleNavigate, missingPage]);

  return (
    <ErrorBoundary
      context="app-root"
      name="App"
      userMessage="The application encountered an error and needs to reload."
      onError={(error) => {
        reportError(error, {
          category: 'rendering',
          severity: 'high',
          context: 'app-root',
        });
      }}
    >
      <ThemeProvider>
        <AdminProvider>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <div className="react-admin-shell">
            <ErrorBoundary
              context="navigation"
              name="SideNav"
              userMessage="Navigation menu failed to load. Please refresh the page."
            >
              <ResponsiveNav
                pages={PAGES}
                activePage={activePage}
                onNavigate={handleNavigate}
                stats={{
                  pins: dataApi.pins.length,
                  timeline: dataApi.timeline.length,
                  connections: dataApi.connections.length,
                }}
              />
            </ErrorBoundary>
            <main
              id="main-content"
              className="react-admin-content"
              aria-live="polite"
              tabIndex="-1"
            >
              <ErrorBoundary
                context="page-content"
                name={`Page-${activePage}`}
                userMessage="This page failed to load. Please try again."
              >
                <Suspense fallback={<PageLoader />}>{pageComponent}</Suspense>
              </ErrorBoundary>
            </main>
          </div>
        </AdminProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
