/**
 * E2E tests for file upload endpoint.
 *
 * Prerequisites:
 *   - Backend server running on localhost:1111
 *   - PostgreSQL database accessible
 *   - JWT_SECRET configured in database
 *
 * Run:
 *   pnpm test server/__tests__/e2e/file-upload.test.ts
 */
import { describe, test, expect, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:1111';
let AUTH_TOKEN = '';

async function checkServerRunning(): Promise<boolean> {
  try {
    const health = await fetch(`${BASE_URL}/health`);
    return health.ok;
  } catch {
    return false;
  }
}

async function setupAuthToken(): Promise<void> {
  // Read JWT secret from database
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const config = await prisma.config.findFirst({ where: { key: 'JWT_SECRET' } });
    const secret = (config?.config as any)?.value;
    if (!secret) throw new Error('JWT_SECRET not found in database');

    AUTH_TOKEN = jwt.sign(
      { sub: '1', id: '1', name: 'e2e-test', role: 'superadmin' },
      secret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function uploadFile(
  filename: string,
  content: string = 'test content'
): Promise<Response> {
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const formData = new FormData();
  formData.append('file', blob, filename);

  return fetch(`${BASE_URL}/api/file/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    body: formData,
  });
}

// Check if server is running before describing tests
const serverRunning = await checkServerRunning();
if (!serverRunning) {
  console.log('⚠️  E2E tests skipped: Backend server not running');
  console.log('   To run E2E tests, start the server with: cd server && pnpm run dev');
}

describe.skipIf(!serverRunning)('E2E: POST /api/file/upload', () => {
  beforeAll(async () => {
    await setupAuthToken();
  });

  test('rejects unauthenticated request', async () => {
    const blob = new Blob(['data']);
    const formData = new FormData();
    formData.append('file', blob, 'test.txt');

    const res = await fetch(`${BASE_URL}/api/file/upload`, {
      method: 'POST',
      body: formData,
    });

    expect(res.status).toBe(401);
  });

  test('uploads simple ASCII filename', async () => {
    const res = await uploadFile('simple-test.txt', 'hello world');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.Message).toBe('Success');
    expect(body.filePath).toBeTruthy();
    expect(body.filePath).toContain('simple-test');
    expect(body.filePath).toContain('.txt');
    expect(body.size).toBeGreaterThan(0);
  });

  test('uploads file with Chinese characters in name', async () => {
    const res = await uploadFile('挽救计划.epub', 'epub content');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.Message).toBe('Success');
    expect(body.filePath).toContain('.epub');
  });

  test('uploads the exact bug #1138 filename — must return 200, not 500', async () => {
    const bugFilename =
      '挽救计划(《火星救援》作者安迪·威尔全新力作,出版后连续16周雄踞亚马逊科幻畅销榜第一名科技宅男+跨星系好友联袂上演太空大救援,硬核工程风+... (z-library.sk, 1lib.sk, z-lib.sk).epub';

    const res = await uploadFile(bugFilename, 'fake epub');
    const body = await res.json();

    // THIS is the core assertion — previously returned 500
    expect(res.status).toBe(200);
    expect(body.Message).toBe('Success');
    expect(body.filePath).toBeTruthy();
    expect(body.filePath).toContain('.epub');
    expect(body.type).toBeTruthy();
  });

  test('uploads file with reserved filesystem characters', async () => {
    const res = await uploadFile('report<2024>final|v2.pdf', 'pdf data');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.Message).toBe('Success');
    expect(body.filePath).toContain('.pdf');
  });

  test('uploads file with extremely long name (250+ chars)', async () => {
    const longName = 'a'.repeat(250) + '.txt';
    const res = await uploadFile(longName, 'long name content');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.Message).toBe('Success');
    expect(body.filePath).toContain('.txt');
  });

  test('uploads file with spaces in name', async () => {
    const res = await uploadFile('my document file.pdf', 'pdf data');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.Message).toBe('Success');
    expect(body.filePath).toContain('.pdf');
  });

  test('uploads file with emoji in name', async () => {
    const res = await uploadFile('notes📝backup.txt', 'emoji name');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.Message).toBe('Success');
  });

  test('uploaded file is accessible via returned path', async () => {
    const content = 'round-trip verification content';
    const res = await uploadFile('roundtrip-test.txt', content);
    const body = await res.json();

    expect(res.status).toBe(200);

    // Fetch the uploaded file back
    const fileRes = await fetch(`${BASE_URL}${body.filePath}`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });
    expect(fileRes.status).toBe(200);

    const downloaded = await fileRes.text();
    expect(downloaded).toBe(content);
  });
});
