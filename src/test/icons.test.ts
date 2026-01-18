import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('App Icons', () => {
  const publicDir = join(__dirname, '../../public');

  it('should have 220x220 icon', () => {
    const iconPath = join(publicDir, 'icon-220x220.png');
    expect(existsSync(iconPath)).toBe(true);

    // Check it's a valid PNG (starts with PNG signature)
    const buffer = readFileSync(iconPath);
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50); // P
    expect(buffer[2]).toBe(0x4e); // N
    expect(buffer[3]).toBe(0x47); // G
  });

  it('should have 400x400 icon', () => {
    const iconPath = join(publicDir, 'icon-400x400.png');
    expect(existsSync(iconPath)).toBe(true);

    // Check it's a valid PNG (starts with PNG signature)
    const buffer = readFileSync(iconPath);
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50); // P
    expect(buffer[2]).toBe(0x4e); // N
    expect(buffer[3]).toBe(0x47); // G
  });

  it('should have favicon.png', () => {
    const iconPath = join(publicDir, 'favicon.png');
    expect(existsSync(iconPath)).toBe(true);

    const buffer = readFileSync(iconPath);
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50); // P
  });

  it('should have favicon-16.png', () => {
    const iconPath = join(publicDir, 'favicon-16.png');
    expect(existsSync(iconPath)).toBe(true);

    const buffer = readFileSync(iconPath);
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50); // P
  });

  it('220x220 icon should have correct dimensions', () => {
    const iconPath = join(publicDir, 'icon-220x220.png');
    const buffer = readFileSync(iconPath);

    // PNG width is at bytes 16-19, height at bytes 20-23 (big-endian)
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    expect(width).toBe(220);
    expect(height).toBe(220);
  });

  it('400x400 icon should have correct dimensions', () => {
    const iconPath = join(publicDir, 'icon-400x400.png');
    const buffer = readFileSync(iconPath);

    // PNG width is at bytes 16-19, height at bytes 20-23 (big-endian)
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    expect(width).toBe(400);
    expect(height).toBe(400);
  });
});
