/**
 * Survivor Stories Data Loader
 * Loads survivor stories from JSON data files
 */

import type { SurvivorStory } from '@/types/content';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';

// Try multiple possible data locations
const POSSIBLE_DIRS = [
  path.join(process.cwd(), 'src', 'phoenix', 'data'),
  path.join(process.cwd(), 'data'),
  path.join(process.cwd(), 'public', 'data'),
  path.join(process.cwd(), 'src', 'data'),
];

const STORY_FILES = [
  'survivorStories.json',
  'survivor-stories.json',
  'stories.json',
];

/**
 * Find the first existing stories data file
 */
function findStoriesFile(): string | null {
  for (const dir of POSSIBLE_DIRS) {
    for (const file of STORY_FILES) {
      const fullPath = path.join(dir, file);
      if (existsSync(fullPath)) {
        return fullPath;
      }
    }
  }
  return null;
}

/**
 * Transform legacy story format to SurvivorStory type
 */
function transformLegacyStory(legacyStory: any): SurvivorStory {
  return {
    id: legacyStory.id?.toString() || Date.now().toString(),
    title: legacyStory.title || legacyStory.name || 'Untitled Story',
    submittedDate: legacyStory.submissionDate || legacyStory.submittedDate || legacyStory.date || legacyStory.createdAt || new Date().toISOString(),
    content: legacyStory.content || legacyStory.story || legacyStory.text || '',
    anonymous: legacyStory.isAnonymous !== false || legacyStory.anonymous !== false,
    author: legacyStory.submittedBy || legacyStory.author || 'Anonymous',
    approved: legacyStory.approved !== false && legacyStory.status !== 'pending',
    contentWarnings: Array.isArray(legacyStory.contentWarnings)
      ? legacyStory.contentWarnings
      : legacyStory.contentWarning
      ? [legacyStory.contentWarning]
      : [],
    legacy_url: legacyStory.legacy_url || legacyStory.permalink,
  };
}

/**
 * Load all stories
 */
export async function loadStories(): Promise<SurvivorStory[]> {
  const storiesFile = findStoriesFile();
  
  if (!storiesFile) {
    console.warn('No survivor stories data file found');
    return [];
  }

  try {
    const content = await fs.readFile(storiesFile, 'utf-8');
    const legacyStories = JSON.parse(content);
    const stories = Array.isArray(legacyStories) 
      ? legacyStories.map(transformLegacyStory)
      : [];
    
    // Sort by submission date descending (newest first)
    return stories.sort((a, b) => 
      new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
    );
  } catch (error) {
    console.error(`Error loading stories from ${storiesFile}:`, error);
    return [];
  }
}

/**
 * Load a single story by ID
 */
export async function loadStoryById(id: string): Promise<SurvivorStory | null> {
  const stories = await loadStories();
  return stories.find(story => story.id === id) || null;
}

/**
 * Load only approved stories (for public display)
 */
export async function loadApprovedStories(): Promise<SurvivorStory[]> {
  const stories = await loadStories();
  return stories.filter(story => story.approved);
}

/**
 * Load pending stories (for moderation)
 */
export async function getPendingStories(): Promise<SurvivorStory[]> {
  const stories = await loadStories();
  return stories.filter(story => !story.approved);
}

/**
 * Search stories by query string (searches title, content)
 */
export async function searchStories(query: string): Promise<SurvivorStory[]> {
  const stories = await loadStories();
  const lowerQuery = query.toLowerCase();
  
  return stories.filter(story => {
    const searchableText = [
      story.title,
      story.content,
    ].join(' ').toLowerCase();
    
    return searchableText.includes(lowerQuery);
  });
}

/**
 * Get stories statistics
 */
export async function getStoryStats(): Promise<{
  total: number;
  approved: number;
  pending: number;
  anonymous: number;
  withWarnings: number;
}> {
  const stories = await loadStories();
  
  return {
    total: stories.length,
    approved: stories.filter(s => s.approved).length,
    pending: stories.filter(s => !s.approved).length,
    anonymous: stories.filter(s => s.anonymous).length,
    withWarnings: stories.filter(s => s.contentWarnings && s.contentWarnings.length > 0).length,
  };
}

/**
 * Get all content warnings with story counts
 */
export async function getContentWarnings(): Promise<Record<string, number>> {
  const stories = await loadStories();
  const counts: Record<string, number> = {};
  
  stories.forEach(story => {
    story.contentWarnings?.forEach(warning => {
      counts[warning] = (counts[warning] || 0) + 1;
    });
  });
  
  return counts;
}
