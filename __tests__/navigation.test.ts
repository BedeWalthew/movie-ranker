import { TAB_NAMES, HEADER_MENU_ITEMS } from '@/lib/constants';

describe('Navigation Constants', () => {
  describe('Tab Names', () => {
    it('should have a "Ranked" tab', () => {
      expect(TAB_NAMES.ranked).toBe('Ranked');
    });

    it('should have an "Unranked" tab', () => {
      expect(TAB_NAMES.unranked).toBe('Unranked');
    });

    it('should have exactly 2 tabs', () => {
      expect(Object.keys(TAB_NAMES)).toHaveLength(2);
    });
  });

  describe('Header Menu Items', () => {
    it('should include "Import CSV"', () => {
      expect(HEADER_MENU_ITEMS).toContain('Import CSV');
    });

    it('should include "Settings"', () => {
      expect(HEADER_MENU_ITEMS).toContain('Settings');
    });

    it('should have exactly 2 menu items', () => {
      expect(HEADER_MENU_ITEMS).toHaveLength(2);
    });
  });
});
