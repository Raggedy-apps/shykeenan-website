/**
 * Memorial/Tribute Data Loader
 * Loads memorial tributes from YAML/JSON files
 */

import type { Tribute } from '@/types/content';
import fs from 'fs/promises';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const MEMORIAL_DIR = path.join(CONTENT_DIR, 'memorial');

/**
 * Load all approved memorial tributes
 */
export async function loadMemorialTributes(includeUnapproved = false): Promise<Tribute[]> {
  try {
    await fs.access(MEMORIAL_DIR);
    
    const files = await fs.readdir(MEMORIAL_DIR);
    const tributes: Tribute[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(MEMORIAL_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const tribute = JSON.parse(content) as Tribute;
        
        // Only include approved tributes unless explicitly requested
        if (tribute.approved || includeUnapproved) {
          tributes.push(tribute);
        }
      }
    }

    // Sort by submission date (newest first)
    return tributes.sort((a, b) => {
      if (!a.submittedDate || !b.submittedDate) return 0;
      return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
    });
  } catch (error) {
    console.warn('Memorial directory not found or empty, returning empty array');
    return [];
  }
}

/**
 * Load a single tribute by ID
 */
export async function loadTributeById(id: string): Promise<Tribute | null> {
  const tributes = await loadMemorialTributes(true);
  return tributes.find(tribute => tribute.id === id) || null;
}

/**
 * Get pending tributes (for moderation)
 */
export async function getPendingTributes(): Promise<Tribute[]> {
  const allTributes = await loadMemorialTributes(true);
  return allTributes.filter(tribute => !tribute.approved);
}

/**
 * Search tributes by name or content
 */
export async function searchTributes(query: string): Promise<Tribute[]> {
  const tributes = await loadMemorialTributes();
  const lowerQuery = query.toLowerCase();

  return tributes.filter(
    tribute =>
      tribute.name.toLowerCase().includes(lowerQuery) ||
      tribute.tribute.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get tribute statistics
 */
export async function getTributeStats(): Promise<{
  total: number;
  approved: number;
  pending: number;
}> {
  const allTributes = await loadMemorialTributes(true);
  
  return {
    total: allTributes.length,
    approved: allTributes.filter(t => t.approved).length,
    pending: allTributes.filter(t => !t.approved).length,
  };
}
