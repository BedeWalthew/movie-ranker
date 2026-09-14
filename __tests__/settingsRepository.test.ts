import { getRankMode, setRankMode } from '@/lib/settingsRepository';

function mockDb() {
  return { getFirstAsync: jest.fn(), runAsync: jest.fn() };
}

describe('rank mode setting', () => {
  it('defaults to pick when nothing is saved', async () => {
    const db = mockDb();
    db.getFirstAsync.mockResolvedValue(null);
    await expect(getRankMode(db as any)).resolves.toBe('pick');
  });

  it('reads back a saved slot mode', async () => {
    const db = mockDb();
    db.getFirstAsync.mockResolvedValue({ value: 'slot' });
    await expect(getRankMode(db as any)).resolves.toBe('slot');
  });

  it('treats an unknown saved value as pick', async () => {
    const db = mockDb();
    db.getFirstAsync.mockResolvedValue({ value: 'drag' });
    await expect(getRankMode(db as any)).resolves.toBe('pick');
  });

  it('upserts the chosen mode', async () => {
    const db = mockDb();
    await setRankMode(db as any, 'slot');
    const [sql, params] = db.runAsync.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO settings/);
    expect(sql).toMatch(/ON CONFLICT\(key\) DO UPDATE/);
    expect(params).toEqual(['rankMode', 'slot']);
  });
});
