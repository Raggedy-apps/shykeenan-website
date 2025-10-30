/**
 * Posts Data Loader
 * Loads blog posts from JSON data files
 */

import type { Post } from '@/types/content';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';

// Try multiple possible data locations
const POSSIBLE_DIRS = [
  path.join(process.cwd(), 'data'),
  path.join(process.cwd(), 'public', 'data'),
  path.join(process.cwd(), 'src', 'data'),
];

const POST_FILES = [
  'final-migrated-posts.json',
  'migrated-posts.json',
  'full-extracted-posts.json',
];

/**
 * Find the first existing posts data file
 */
function findPostsFile(): string | null {
  for (const dir of POSSIBLE_DIRS) {
    for (const file of POST_FILES) {
      const fullPath = path.join(dir, file);
      if (existsSync(fullPath)) {
        return fullPath;
      }
    }
  }
  return null;
}

/**
 * Transform legacy post format to Post type
 */
function transformLegacyPost(legacyPost: any): Post {
  return {
    id: legacyPost.id?.toString() || Date.now().toString(),
    title: legacyPost.title || 'Untitled',
    slug: legacyPost.slug || legacyPost.permalink?.replace(/^\/posts\/|\.html$/g, '') || '',
    content: legacyPost.content || '',
    excerpt: legacyPost.excerpt || '',
    date: legacyPost.date || new Date().toISOString(),
    author: typeof legacyPost.author === 'string' 
      ? legacyPost.author 
      : legacyPost.author?.name || 'Unknown',
    published: legacyPost.published !== false,
    categories: Array.isArray(legacyPost.categories)
      ? legacyPost.categories.map((cat: any) => typeof cat === 'string' ? cat : cat.name || cat.slug)
      : [],
    tags: Array.isArray(legacyPost.tags)
      ? legacyPost.tags.map((tag: any) => typeof tag === 'string' ? tag : tag.name || tag.slug)
      : [],
    legacy_url: legacyPost.permalink || legacyPost.legacy_url,
    assets: legacyPost.assets || [],
  };
}

/**
 * Load all posts
 */
export async function loadPosts(): Promise<Post[]> {
  const postsFile = findPostsFile();
  
  if (!postsFile) {
    console.warn('No posts data file found');
    return [];
  }

  try {
    const content = await fs.readFile(postsFile, 'utf-8');
    const legacyPosts = JSON.parse(content);
    const posts = Array.isArray(legacyPosts) 
      ? legacyPosts.map(transformLegacyPost)
      : [];
    
    // Sort by date descending (newest first)
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error(`Error loading posts from ${postsFile}:`, error);
    return [];
  }
}

/**
 * Load a single post by slug
 */
export async function loadPostBySlug(slug: string): Promise<Post | null> {
  const posts = await loadPosts();
  return posts.find(post => post.slug === slug) || null;
}

/**
 * Load a single post by ID
 */
export async function loadPostById(id: string): Promise<Post | null> {
  const posts = await loadPosts();
  return posts.find(post => post.id === id) || null;
}

/**
 * Load posts by category
 */
export async function loadPostsByCategory(category: string): Promise<Post[]> {
  const posts = await loadPosts();
  return posts.filter(post => 
    post.categories?.some(cat => 
      cat.toLowerCase() === category.toLowerCase()
    )
  );
}

/**
 * Load only published posts
 */
export async function loadPublishedPosts(): Promise<Post[]> {
  const posts = await loadPosts();
  return posts.filter(post => post.published);
}

/**
 * Get all unique categories with post counts
 */
export async function getPostCategories(): Promise<Record<string, number>> {
  const posts = await loadPosts();
  const counts: Record<string, number> = {};
  
  posts.forEach(post => {
    post.categories?.forEach(category => {
      counts[category] = (counts[category] || 0) + 1;
    });
  });
  
  return counts;
}

/**
 * Get all unique tags with post counts
 */
export async function getPostTags(): Promise<Record<string, number>> {
  const posts = await loadPosts();
  const counts: Record<string, number> = {};
  
  posts.forEach(post => {
    post.tags?.forEach(tag => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });
  
  return counts;
}

/**
 * Search posts by query string (searches title, content, excerpt, tags, categories)
 */
export async function searchPosts(query: string): Promise<Post[]> {
  const posts = await loadPosts();
  const lowerQuery = query.toLowerCase();
  
  return posts.filter(post => {
    const searchableText = [
      post.title,
      post.content,
      post.excerpt,
      ...(post.categories || []),
      ...(post.tags || []),
    ].join(' ').toLowerCase();
    
    return searchableText.includes(lowerQuery);
  });
}

/**
 * Get posts statistics
 */
export async function getPostStats(): Promise<{
  total: number;
  published: number;
  drafts: number;
  categories: number;
  tags: number;
}> {
  const posts = await loadPosts();
  const categories = await getPostCategories();
  const tags = await getPostTags();
  
  return {
    total: posts.length,
    published: posts.filter(p => p.published).length,
    drafts: posts.filter(p => !p.published).length,
    categories: Object.keys(categories).length,
    tags: Object.keys(tags).length,
  };
}
