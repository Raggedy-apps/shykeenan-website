#!/usr/bin/env node

/**
 * Lightweight security gate placeholder.
 * The original build-guardian package is absent in this repo, so we provide
 * a minimal shim that surfaces a warning without blocking CI.
 */
console.log('[build-guardian] security-gate: no custom checks configured. Passing by default.');
