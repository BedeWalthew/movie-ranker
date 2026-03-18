import { theme } from '@/lib/theme';

describe('Theme Configuration', () => {
  describe('Dark mode colors', () => {
    it('should have a dark background color', () => {
      // Background should be very dark (near black)
      const bg = theme.colors.background;
      expect(bg).toBeDefined();
      const r = parseInt(bg.slice(1, 3), 16);
      const g = parseInt(bg.slice(3, 5), 16);
      const b = parseInt(bg.slice(5, 7), 16);
      const brightness = (r + g + b) / 3;
      expect(brightness).toBeLessThan(30);
    });

    it('should have light text color', () => {
      const text = theme.colors.text;
      expect(text).toBeDefined();
      const r = parseInt(text.slice(1, 3), 16);
      const g = parseInt(text.slice(3, 5), 16);
      const b = parseInt(text.slice(5, 7), 16);
      const brightness = (r + g + b) / 3;
      expect(brightness).toBeGreaterThan(200);
    });

    it('should have a dark surface color', () => {
      const surface = theme.colors.surface;
      expect(surface).toBeDefined();
      const r = parseInt(surface.slice(1, 3), 16);
      const g = parseInt(surface.slice(3, 5), 16);
      const b = parseInt(surface.slice(5, 7), 16);
      const brightness = (r + g + b) / 3;
      expect(brightness).toBeLessThan(50);
    });

    it('should have a dark tab bar background', () => {
      expect(theme.colors.tabBar).toBeDefined();
      const bg = theme.colors.tabBar;
      const r = parseInt(bg.slice(1, 3), 16);
      const g = parseInt(bg.slice(3, 5), 16);
      const b = parseInt(bg.slice(5, 7), 16);
      const brightness = (r + g + b) / 3;
      expect(brightness).toBeLessThan(30);
    });

    it('should have a dark header background', () => {
      expect(theme.colors.headerBackground).toBeDefined();
      const bg = theme.colors.headerBackground;
      const r = parseInt(bg.slice(1, 3), 16);
      const g = parseInt(bg.slice(3, 5), 16);
      const b = parseInt(bg.slice(5, 7), 16);
      const brightness = (r + g + b) / 3;
      expect(brightness).toBeLessThan(30);
    });

    it('should have a primary accent color', () => {
      expect(theme.colors.primary).toBeDefined();
      expect(theme.colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should have a secondary text color', () => {
      expect(theme.colors.textSecondary).toBeDefined();
    });
  });

  describe('All required color keys exist', () => {
    const requiredKeys = [
      'background',
      'surface',
      'primary',
      'text',
      'textSecondary',
      'tabBar',
      'headerBackground',
    ];

    requiredKeys.forEach((key) => {
      it(`should have "${key}" color defined`, () => {
        expect(theme.colors).toHaveProperty(key);
      });
    });
  });
});
