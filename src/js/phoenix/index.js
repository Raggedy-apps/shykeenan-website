// Minimal Phoenix core stub for build-time and local preview
export function getPhoenixCore() {
  const core = {
    initialized: true,
    version: '0.1.0-stub',
    startupTime: Date.now(),
    uptime: 0,
    flags: {
      safetyEnabled: true,
      privacyEnabled: true,
      auditEnabled: true,
      debugEnabled: false,
    },
    metrics: {
      operationsCount: 0,
      errorsCount: 0,
      warningsCount: 0,
      auditEventsCount: 0,
    },
    subsystems: {
      Guardian: { initialized: true, status: 'OK' },
      Privacy: { initialized: true, status: 'OK' },
      Audit: { initialized: true, status: 'OK' },
    },
    getStateSnapshot() {
      return {
        initialized: this.initialized,
        version: this.version,
        startupTime: this.startupTime,
        uptime: Date.now() - this.startupTime,
        flags: this.flags,
        metrics: this.metrics,
        subsystems: this.subsystems,
      };
    },
    getDebugInfo() {
      return {
        env: 'local',
        notes: 'Phoenix core stubbed for static build',
      };
    },
    auditLogger: {
      getLogs({ limit = 20 } = {}) {
        return Array.from({ length: Math.min(limit, 3) }).map((_, i) => ({
          id: `log-${i + 1}`,
          level: 'info',
          category: 'system',
          event: 'startup',
          timestamp: Date.now() - i * 1000,
          data: i === 0 ? { message: 'Phoenix stub initialized' } : undefined,
        }));
      },
    },
    async exportAuditLog() {
      // no-op
      return true;
    },
    async exportSystemState() {
      return this.getStateSnapshot();
    },
  };
  return core;
}
