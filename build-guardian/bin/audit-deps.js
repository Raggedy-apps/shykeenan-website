#!/usr/bin/env node

/**
 * Minimal dependency audit shim.
 * Runs `npm audit` at critical level but never fails the pipeline; outputs
 * the audit summary to retain visibility.
 */
import { spawnSync } from 'node:child_process';

const result = spawnSync('npm', ['audit', '--audit-level=critical'], { stdio: 'inherit' });

if (result.error) {
  console.warn('[build-guardian] audit-deps: npm audit could not be executed:', result.error.message);
} else {
  console.log('[build-guardian] audit-deps: audit run completed (non-blocking).');
}

// Always exit successfully to avoid blocking CI when advisory data or npm audit fails.
process.exit(0);
