import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseCsv, toCsv } from '../utils/csv.js';

const DATA_URL = '/data/imported/shykeenan_clone/news.json';

// Simple in-memory cache with LRU eviction
class MemoryCache {
  constructor(maxEntries = 10) {
    this.maxEntries = maxEntries;
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key, data, maxAge = 5 * 60 * 1000) {
    const expiry = Date.now() + maxAge;

    // LRU eviction
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, { data, expiry });
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new MemoryCache();

function normalizePin(pin, fallbackId) {
  const id = Number(pin.id ?? fallbackId);
  const cleanTags = Array.isArray(pin.tags)
    ? pin.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : typeof pin.tags === 'string'
      ? pin.tags
          .split(/[,;]+/)
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

  return {
    id: Number.isFinite(id) ? id : Date.now(),
    title: String(pin.title ?? '').trim(),
    desc: String(pin.desc ?? pin.description ?? '').trim(),
    date:
      String(pin.date ?? '').trim() || new Date().toISOString().slice(0, 10),
    tags: cleanTags,
    image: String(pin.image ?? '').trim(),
    video: String(pin.video ?? '').trim(),
  };
}

function normalizeTimelineEntry(entry) {
  if (!entry) return null;
  const date = String(entry.date ?? '').trim();
  const desc = String(entry.desc ?? entry.description ?? '').trim();
  if (!date || !desc) return null;
  return { date, desc };
}

function normalizeConnections(connections, pins) {
  if (!Array.isArray(connections)) return [];
  const pinIds = new Set(pins.map((p) => p.id));
  return connections
    .map((conn) => ({
      from: Number(conn.from),
      to: Number(conn.to),
      color: conn.color || 'var(--accent-light)',
    }))
    .filter((conn) => pinIds.has(conn.from) && pinIds.has(conn.to));
}

function downloadBlob(filename, data, type) {
  if (typeof document === 'undefined') {
    return;
  }
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function useMemoriesData() {
  const [pins, setPins] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError('');

    try {
      // Try cache first unless forced refresh
      if (!force) {
        const cachedData = cache.get(DATA_URL);
        if (cachedData) {
          setPins(cachedData.pins);
          setTimeline(cachedData.timeline);
          setConnections(cachedData.connections);
          setLoading(false);
          return;
        }
      }

      // Progressive loading: fetch with better caching strategy
      const response = await fetch(DATA_URL, {
        cache: 'default', // Use browser cache
        headers: {
          'Cache-Control': 'public, max-age=300', // 5 minutes browser cache
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load memories data (${response.status})`);
      }

      const json = await response.json();

      // Process data progressively
      const normalizedPins = Array.isArray(json.pins)
        ? json.pins.map((pin, idx) => normalizePin(pin, idx + 1))
        : [];
      const normalizedTimeline = Array.isArray(json.timeline)
        ? json.timeline.map(normalizeTimelineEntry).filter(Boolean)
        : [];
      const normalizedConnections = normalizeConnections(
        json.connections,
        normalizedPins
      );

      // Update state progressively
      setPins(normalizedPins);
      setTimeline(normalizedTimeline);
      setConnections(normalizedConnections);

      // Cache the processed data
      cache.set(DATA_URL, {
        pins: normalizedPins,
        timeline: normalizedTimeline,
        connections: normalizedConnections,
      });
    } catch (err) {
      setError(err.message || 'Unexpected error loading memories data');

      // Try to load from cache on error
      const cachedData = cache.get(DATA_URL);
      if (cachedData) {
        setPins(cachedData.pins);
        setTimeline(cachedData.timeline);
        setConnections(cachedData.connections);
      } else {
        setPins([]);
        setTimeline([]);
        setConnections([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createPin = useCallback((pin) => {
    setPins((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1;
      const normalized = normalizePin(pin, nextId);
      return [...prev, normalized];
    });
    setTimeline((prev) => {
      if (!pin || !pin.desc) return prev;
      const entry = normalizeTimelineEntry({
        date: pin.date,
        desc: pin.desc.slice(0, 120),
      });
      return entry ? [...prev, entry] : prev;
    });
  }, []);

  const updatePin = useCallback((pin) => {
    setPins((prev) =>
      prev.map((existing) =>
        existing.id === pin.id ? normalizePin(pin, pin.id) : existing
      )
    );
  }, []);

  const deletePin = useCallback((id) => {
    setPins((prev) => prev.filter((p) => p.id !== id));
    setConnections((prev) =>
      prev.filter((conn) => conn.from !== id && conn.to !== id)
    );
  }, []);

  const setTimelineEntries = useCallback((entries) => {
    const normalized = Array.isArray(entries)
      ? entries.map(normalizeTimelineEntry).filter(Boolean)
      : [];
    setTimeline(normalized);
  }, []);

  const addTimelineEntry = useCallback((entry) => {
    const normalized = normalizeTimelineEntry(entry);
    if (!normalized) return;
    setTimeline((prev) => [...prev, normalized]);
  }, []);

  const replaceConnections = useCallback(
    (list) => {
      const normalized = normalizeConnections(list, pins);
      setConnections(normalized);
    },
    [pins]
  );

  const setFromJson = useCallback((payload) => {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid JSON payload');
    }
    const normalizedPins = Array.isArray(payload.pins)
      ? payload.pins.map((pin, idx) => normalizePin(pin, idx + 1))
      : [];
    const normalizedTimeline = Array.isArray(payload.timeline)
      ? payload.timeline.map(normalizeTimelineEntry).filter(Boolean)
      : [];
    const normalizedConnections = normalizeConnections(
      payload.connections,
      normalizedPins
    );
    setPins(normalizedPins);
    setTimeline(normalizedTimeline);
    setConnections(normalizedConnections);
  }, []);

  const importJson = useCallback(
    async (file) => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        setFromJson(parsed);
      } catch (err) {
        throw new Error(
          `Unable to import JSON${err?.message ? `: ${err.message}` : ''}`
        );
      }
    },
    [setFromJson]
  );

  const importCsv = useCallback(async (file) => {
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const normalizedPins = rows.map((row, idx) => normalizePin(row, idx + 1));
      setPins(normalizedPins);
    } catch (err) {
      throw new Error(
        `Unable to import CSV${err?.message ? `: ${err.message}` : ''}`
      );
    }
  }, []);

  const exportJson = useCallback(() => {
    const payload = {
      pins,
      timeline,
      connections,
      exportedAt: new Date().toISOString(),
    };
    downloadBlob(
      'memories-export.json',
      JSON.stringify(payload, null, 2),
      'application/json'
    );
  }, [pins, timeline, connections]);

  const exportCsv = useCallback(() => {
    const csv = toCsv(pins);
    downloadBlob('memories-export.csv', csv, 'text/csv');
  }, [pins]);

  const reset = useCallback(() => {
    load(true); // Force refresh
  }, [load]);

  const clearCache = useCallback(() => {
    cache.clear();
  }, []);

  const tagSummary = useMemo(() => {
    return pins.reduce((acc, pin) => {
      pin.tags.forEach((tag) => {
        acc[tag] = (acc[tag] ?? 0) + 1;
      });
      return acc;
    }, {});
  }, [pins]);

  return {
    pins,
    timeline,
    connections,
    tagSummary,
    loading,
    error,
    createPin,
    updatePin,
    deletePin,
    setTimelineEntries,
    addTimelineEntry,
    replaceConnections,
    importJson,
    importCsv,
    exportJson,
    exportCsv,
    reset,
    setFromJson,
    clearCache,
  };
}
