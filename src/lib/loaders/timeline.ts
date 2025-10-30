/**
 * Timeline Data Loader
 * Loads timeline events from YAML/JSON files or MDX frontmatter
 */

import type { TimelineCategory, TimelineEvent } from '@/types/content';
import fs from 'fs/promises';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const TIMELINE_DIR = path.join(CONTENT_DIR, 'timeline');

/**
 * Load all timeline events
 */
export async function loadTimelineEvents(): Promise<TimelineEvent[]> {
  try {
    await fs.access(TIMELINE_DIR);
    
    const files = await fs.readdir(TIMELINE_DIR);
    const events: TimelineEvent[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(TIMELINE_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const event = JSON.parse(content) as TimelineEvent;
        events.push(event);
      }
    }

    // Sort by date (ascending - oldest first)
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.warn('Timeline directory not found or empty, returning empty array');
    return [];
  }
}

/**
 * Load a single timeline event by ID
 */
export async function loadTimelineEventById(id: string): Promise<TimelineEvent | null> {
  const events = await loadTimelineEvents();
  return events.find(event => event.id === id) || null;
}

/**
 * Load timeline events by category
 */
export async function loadTimelineEventsByCategory(category: TimelineCategory): Promise<TimelineEvent[]> {
  const events = await loadTimelineEvents();
  return events.filter(event => event.category === category);
}

/**
 * Load timeline events by year range
 */
export async function loadTimelineEventsByYearRange(startYear: number, endYear: number): Promise<TimelineEvent[]> {
  const events = await loadTimelineEvents();
  return events.filter(event => {
    const eventYear = new Date(event.date).getFullYear();
    return eventYear >= startYear && eventYear <= endYear;
  });
}

/**
 * Get timeline years with event counts
 */
export async function getTimelineYears(): Promise<Record<number, number>> {
  const events = await loadTimelineEvents();
  const years: Record<number, number> = {};

  for (const event of events) {
    const year = new Date(event.date).getFullYear();
    years[year] = (years[year] || 0) + 1;
  }

  return years;
}

/**
 * Get timeline categories with counts
 */
export async function getTimelineCategories(): Promise<Record<TimelineCategory, number>> {
  const events = await loadTimelineEvents();
  const categories: Record<string, number> = {};

  for (const event of events) {
    categories[event.category] = (categories[event.category] || 0) + 1;
  }

  return categories as Record<TimelineCategory, number>;
}

/**
 * Get timeline date range (earliest and latest events)
 */
export async function getTimelineDateRange(): Promise<{ start: Date; end: Date } | null> {
  const events = await loadTimelineEvents();
  
  if (events.length === 0) {
    return null;
  }

  const start = new Date(events[0].date);
  const end = new Date(events[events.length - 1].date);

  return { start, end };
}

/**
 * Search timeline events
 */
export async function searchTimelineEvents(query: string): Promise<TimelineEvent[]> {
  const events = await loadTimelineEvents();
  const lowerQuery = query.toLowerCase();

  return events.filter(
    event =>
      event.title.toLowerCase().includes(lowerQuery) ||
      event.description.toLowerCase().includes(lowerQuery) ||
      event.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
