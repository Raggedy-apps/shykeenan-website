// dataApi.js — provides canonical data for MemoriesPage and AdminPage
import timelineEvents from '../../data/timeline-events.json';
import migratedPosts from '../../data/migrated-posts.json';

export function getTimeline() {
  // Combine timeline events with migrated posts for a more complete timeline
  const combined = [
    ...timelineEvents.map(e => ({
      date: e.publishedDate,
      title: e.title,
      summary: e.summary,
      timelineEventId: e.timelineEventId,
      type: 'timeline'
    })),
    ...migratedPosts.map((post, index) => ({
      date: post.date,
      title: post.title,
      summary: post.body.substring(0, 200) + '...', // Truncate long content
      timelineEventId: `post-${index}`,
      type: 'post'
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

  return combined;
}

export function getPins() {
  // Use migrated posts as pins/memories
  return migratedPosts.map((post, index) => ({
    id: `pin-${index}`,
    title: post.title,
    content: post.body,
    date: post.date,
    author: post.author,
    categories: post.categories,
    tags: post.tags,
    url: post.url,
  }));
}

export function getTagSummary() {
  // Extract tags from posts - use categories as tags since tags array is empty
  const tagMap = {};
  migratedPosts.forEach(post => {
    post.categories.forEach(category => {
      if (!tagMap[category]) {
        tagMap[category] = { tag: category, count: 0 };
      }
      tagMap[category].count++;
    });
  });
  return Object.values(tagMap);
}

export function getConnections() {
  // Placeholder for now - could implement based on categories or related posts
  return [];
}

export function getDataApi() {
  return {
    pins: getPins(),
    timeline: getTimeline(),
    tagSummary: getTagSummary(),
    connections: getConnections(),
    loading: false,
    error: null,
    createPin: () => {},
    updatePin: () => {},
    deletePin: () => {},
    importJson: async () => {},
    importCsv: async () => {},
    exportJson: () => {},
    exportCsv: () => {},
    reset: () => {},
    setTimelineEntries: () => {},
  };
}
