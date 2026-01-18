import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('Sideload Documentation', () => {
  const docsPath = resolve(__dirname, '../../docs/SIDELOAD.md');

  it('should exist at docs/SIDELOAD.md', () => {
    expect(existsSync(docsPath)).toBe(true);
  });

  it('should contain required sections', () => {
    const content = readFileSync(docsPath, 'utf-8');

    // Check for main title
    expect(content).toContain('# Ted IPTV Player - Sideload Guide');

    // Check for prerequisites section
    expect(content).toContain('## Prerequisites');

    // Check for build instructions
    expect(content).toContain('## Step 1: Build the Application');
    expect(content).toContain('npm run build');

    // Check for developer mode instructions
    expect(content).toContain('## Step 2: Enable Developer Mode');

    // Check for vidaa-appstore tool
    expect(content).toContain('## Step 3: Install vidaa-appstore Tool');
    expect(content).toContain('vidaa-appstore');

    // Check for package preparation
    expect(content).toContain('## Step 4: Prepare the App Package');
    expect(content).toContain('app.json');

    // Check for deployment instructions
    expect(content).toContain('## Step 5: Deploy to Your TV');

    // Check for launch instructions
    expect(content).toContain('## Step 6: Launch the App');
  });

  it('should contain troubleshooting section', () => {
    const content = readFileSync(docsPath, 'utf-8');

    expect(content).toContain('## Troubleshooting');
    expect(content).toContain('App Not Appearing');
    expect(content).toContain('Connection Refused');
    expect(content).toContain('Video Playback');
    expect(content).toContain('Remote Control');
  });

  it('should contain uninstall instructions', () => {
    const content = readFileSync(docsPath, 'utf-8');

    expect(content).toContain('## Uninstalling the App');
    expect(content).toContain('vidaa-appstore uninstall');
  });

  it('should contain update instructions', () => {
    const content = readFileSync(docsPath, 'utf-8');

    expect(content).toContain('## Updating the App');
  });

  it('should contain alternative hosting method', () => {
    const content = readFileSync(docsPath, 'utf-8');

    expect(content).toContain('## Hosting the App');
    expect(content).toContain('Alternative Method');
  });

  it('should contain security notes', () => {
    const content = readFileSync(docsPath, 'utf-8');

    expect(content).toContain('## Security Notes');
    expect(content).toContain('encrypted');
    expect(content).toContain('client-side');
  });

  it('should contain app manifest example', () => {
    const content = readFileSync(docsPath, 'utf-8');

    expect(content).toContain('"id": "ted.iptv.player"');
    expect(content).toContain('"name": "Ted IPTV"');
    expect(content).toContain('"icon": "icon-220x220.png"');
  });

  it('should reference correct icon files', () => {
    const content = readFileSync(docsPath, 'utf-8');

    expect(content).toContain('icon-220x220.png');
    expect(content).toContain('icon-400x400.png');
  });
});
