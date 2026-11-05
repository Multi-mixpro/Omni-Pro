import { expect, it } from 'vitest';
import { isCloudinaryUploadUrl } from './cloudinary';

it('accepts Cloudinary media without accepting Base64, external hosts, or lookalike domains', () => {
  expect(isCloudinaryUploadUrl('https://res.cloudinary.com/demo/image/upload/v1/photo.jpg', true)).toBe(true);
  expect(isCloudinaryUploadUrl('https://res.cloudinary.com/demo/raw/upload/v1/file.docx')).toBe(true);
  expect(isCloudinaryUploadUrl('https://res.cloudinary.com/demo/raw/upload/v1/file.docx', true)).toBe(false);
  for (const url of [
    'data:image/png;base64,AAAA',
    'https://res.cloudinary.com.example.com/demo/image/upload/photo.jpg',
    'https://example.com/photo.jpg',
    'https://user@res.cloudinary.com/demo/image/upload/photo.jpg',
  ]) expect(isCloudinaryUploadUrl(url)).toBe(false);
});
