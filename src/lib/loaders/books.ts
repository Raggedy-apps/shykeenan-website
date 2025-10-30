/**
 * Books Data Loader
 * Loads book data from YAML/JSON files or MDX frontmatter
 */

import type { Book } from '@/types/content';
import fs from 'fs/promises';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const BOOKS_DIR = path.join(CONTENT_DIR, 'books');

/**
 * Load all books from content directory
 */
export async function loadBooks(): Promise<Book[]> {
  try {
    // Check if books directory exists
    await fs.access(BOOKS_DIR);
    
    const files = await fs.readdir(BOOKS_DIR);
    const books: Book[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(BOOKS_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const book = JSON.parse(content) as Book;
        books.push(book);
      }
    }

    // Sort by year (descending)
    return books.sort((a, b) => b.year - a.year);
  } catch (error) {
    console.warn('Books directory not found or empty, returning empty array');
    return [];
  }
}

/**
 * Load a single book by ID
 */
export async function loadBookById(id: string): Promise<Book | null> {
  const books = await loadBooks();
  return books.find(book => book.id === id) || null;
}

/**
 * Load books by category
 */
export async function loadBooksByCategory(category: Book['category']): Promise<Book[]> {
  const books = await loadBooks();
  return books.filter(book => book.category === category);
}

/**
 * Get book categories with counts
 */
export async function getBookCategories(): Promise<Record<string, number>> {
  const books = await loadBooks();
  const categories: Record<string, number> = {};

  for (const book of books) {
    categories[book.category] = (categories[book.category] || 0) + 1;
  }

  return categories;
}

/**
 * Search books by title or description
 */
export async function searchBooks(query: string): Promise<Book[]> {
  const books = await loadBooks();
  const lowerQuery = query.toLowerCase();

  return books.filter(
    book =>
      book.title.toLowerCase().includes(lowerQuery) ||
      book.description.toLowerCase().includes(lowerQuery)
  );
}
