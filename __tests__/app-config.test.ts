import * as fs from 'fs';
import * as path from 'path';

describe('App Configuration', () => {
  const appJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf-8')
  );

  it('should have userInterfaceStyle set to dark', () => {
    expect(appJson.expo.userInterfaceStyle).toBe('dark');
  });

  it('should have a dark splash background', () => {
    const bgColor = appJson.expo.splash.backgroundColor;
    const r = parseInt(bgColor.slice(1, 3), 16);
    const g = parseInt(bgColor.slice(3, 5), 16);
    const b = parseInt(bgColor.slice(5, 7), 16);
    const brightness = (r + g + b) / 3;
    expect(brightness).toBeLessThan(30);
  });

  it('should have expo-router plugin', () => {
    expect(appJson.expo.plugins).toContain('expo-router');
  });

  it('should have expo-sqlite plugin', () => {
    expect(appJson.expo.plugins).toContain('expo-sqlite');
  });

  it('should have a URL scheme configured', () => {
    expect(appJson.expo.scheme).toBeDefined();
    expect(appJson.expo.scheme).toBe('movie-ranker');
  });

  it('should be configured for portrait orientation', () => {
    expect(appJson.expo.orientation).toBe('portrait');
  });
});
