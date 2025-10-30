/* eslint-disable no-console */

// Service Worker registration and management
const SW_URL = '/sw.js';

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(SW_URL)
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);

          if (registration.active) {
            registration.active.postMessage({ type: 'CACHE_WARM' });
          } else {
            navigator.serviceWorker.ready.then((ready) => {
              ready.active?.postMessage({ type: 'CACHE_WARM' });
            });
          }

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker installed, prompt user to refresh
                  if (
                    confirm(
                      'New version available! Click OK to refresh and use the latest version.'
                    )
                  ) {
                    window.location.reload();
                  }
                }
              });
            }
          });

          // Handle messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (!event.data || typeof event.data !== 'object') return;

            if (event.data.type === 'SW_UPDATE_READY') {
              if (confirm('App update available! Click OK to refresh.')) {
                window.location.reload();
              }
            }

            if (event.data.type === 'THEME_CACHE_READY') {
              const themeName = event.data.theme || 'default';
              console.info(`Theme assets cached for ${themeName} mode.`);
            }
          });

          return registration;
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.log('Service Worker unregistration failed:', error);
      });
  }
}

export function clearAllCaches() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_CACHE',
    });
  }

  // Also clear memory cache
  if (window.memoriesDataApi && window.memoriesDataApi.clearCache) {
    window.memoriesDataApi.clearCache();
  }
}

export function updateServiceWorker() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SKIP_WAITING',
    });
  }
}
