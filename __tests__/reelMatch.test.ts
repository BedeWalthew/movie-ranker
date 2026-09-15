import { buildReelIndex, findOnReel, type ReelEntry } from '@/lib/reelMatch';

function entry(overrides: Partial<ReelEntry>): ReelEntry {
  return {
    id: 'e1',
    title: 'Parasite',
    year: 2019,
    tmdbId: null,
    rank: null,
    letterboxdUri: null,
    ...overrides,
  };
}

describe('findOnReel', () => {
  it('matches on TMDB id even when the titles differ', () => {
    const index = buildReelIndex([entry({ title: 'Gisaengchung', tmdbId: 496243 })]);
    expect(findOnReel(index, { tmdbId: 496243, title: 'Parasite', year: 2019 })?.id).toBe('e1');
  });

  it('matches an import without an id on title and year, ignoring case, accents and punctuation', () => {
    const index = buildReelIndex([
      entry({ id: 'amelie', title: 'Amélie', year: 2001 }),
      entry({ id: 'lock', title: 'Lock, Stock and Two Smoking Barrels', year: 1998 }),
    ]);

    expect(findOnReel(index, { tmdbId: 194, title: 'AMELIE', year: 2001 })?.id).toBe('amelie');
    expect(findOnReel(index, { tmdbId: 100, title: 'Lock, Stock & Two Smoking Barrels', year: 1998 })?.id).toBe('lock');
  });

  it('does not match the same title from another year', () => {
    const index = buildReelIndex([entry({ title: 'Dune', year: 1984 })]);
    expect(findOnReel(index, { tmdbId: 438631, title: 'Dune', year: 2021 })).toBeNull();
  });

  it('treats two different TMDB ids with the same title and year as different films', () => {
    const index = buildReelIndex([entry({ title: 'Hamlet', year: 1996, tmdbId: 10549 })]);
    expect(findOnReel(index, { tmdbId: 99999, title: 'Hamlet', year: 1996 })).toBeNull();
  });

  it('matches a film with no id against an entry that has one, by title and year', () => {
    const index = buildReelIndex([entry({ tmdbId: 496243 })]);
    expect(findOnReel(index, { tmdbId: null, title: 'parasite', year: 2019 })?.id).toBe('e1');
  });

  it('keeps titles in other scripts apart instead of collapsing them to nothing', () => {
    const index = buildReelIndex([entry({ id: 'spirited', title: '千と千尋の神隠し', year: 2001 })]);

    expect(findOnReel(index, { tmdbId: 1, title: 'ハウルの動く城', year: 2001 })).toBeNull();
    expect(findOnReel(index, { tmdbId: 129, title: '千と千尋の神隠し', year: 2001 })?.id).toBe('spirited');
  });

  it('never matches on a title with no letters or digits', () => {
    const index = buildReelIndex([entry({ title: '...', year: 2000 })]);
    expect(findOnReel(index, { tmdbId: 5, title: '?!', year: 2000 })).toBeNull();
  });
});
