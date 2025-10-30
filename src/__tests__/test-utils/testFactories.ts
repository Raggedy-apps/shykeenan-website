import type { Tribute } from "@/types";

const BASE_CREATED_AT = new Date(Date.UTC(2023, 9, 1, 12, 0, 0)).toISOString();
const BASE_APPROVED_AT = new Date(Date.UTC(2023, 9, 2, 12, 0, 0)).toISOString();

export function createMockTribute(overrides: Partial<Tribute> = {}): Tribute {
  const base: Tribute = {
    id: `mock-tribute-${Math.random().toString(36).slice(2, 11)}`,
    name: "John Doe",
    displayName: "John Doe",
    message: "This is a heartfelt tribute message.",
    isApproved: true,
    status: "approved",
    createdAt: BASE_CREATED_AT,
    updatedAt: BASE_APPROVED_AT,
    approvedAt: BASE_APPROVED_AT,
    approvedBy: null,
    email: "john@example.com",
  };

  return {
    ...base,
    ...overrides,
  };
}

export function createMockTributes(count: number = 1): Tribute[] {
  return Array.from({ length: count }, (_, index) => {
    const createdAt = new Date(Date.UTC(2023, 9, 1 + index, 12, 0, 0)).toISOString();
    const approvedAt = new Date(Date.UTC(2023, 9, 2 + index, 12, 0, 0)).toISOString();

    return createMockTribute({
      id: `mock-tribute-${index + 1}`,
      name: `User ${index + 1}`,
      displayName: `User ${index + 1}`,
      message: `Mock tribute message ${index + 1}`,
      email: `user${index + 1}@example.com`,
      createdAt,
      updatedAt: approvedAt,
      approvedAt,
    });
  });
}

export function createMockSearchSuggestions(count: number = 3): any[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `suggestion-${i}`,
    type: "story",
    title: `Suggestion ${i + 1}`,
    excerpt: `Excerpt for suggestion ${i + 1}`,
    path: `/path/${i + 1}`,
  }));
}