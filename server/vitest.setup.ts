import { beforeAll, afterEach, vi } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';

// Clean up mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
