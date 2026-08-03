import { describe, expect, it } from 'vitest';
import { validateArticleMediaFile } from './media';

const projectId = '550e8400-e29b-41d4-a716-446655440000';

describe('validateArticleMediaFile', () => {
  it('requires an article persisted with a UUID', () => {
    expect(() => validateArticleMediaFile('art-demo', {
      name: 'sample.jpg',
      type: 'image/jpeg',
      size: 1024,
    })).toThrow(/tersimpan di database/i);
  });

  it('rejects unsupported executable files', () => {
    expect(() => validateArticleMediaFile(projectId, {
      name: 'unsafe.exe',
      type: 'application/x-msdownload',
      size: 1024,
    })).toThrow(/format file belum didukung/i);
  });

  it('enforces the 10 MB image limit', () => {
    expect(() => validateArticleMediaFile(projectId, {
      name: 'oversized.png',
      type: 'image/png',
      size: 10 * 1024 * 1024 + 1,
    })).toThrow(/10 MB/i);
  });

  it('accepts a PDF below the 20 MB document limit', () => {
    expect(() => validateArticleMediaFile(projectId, {
      name: 'tech-pack.pdf',
      type: 'application/pdf',
      size: 5 * 1024 * 1024,
    })).not.toThrow();
  });
});
