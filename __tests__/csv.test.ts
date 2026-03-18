import { parseLetterboxdCsv, type LetterboxdEntry } from '@/lib/csv';

describe('parseLetterboxdCsv', () => {
  it('parses a valid Letterboxd CSV with headers', () => {
    const csv = `Date,Name,Year,Letterboxd URI,Rating
2023-01-15,Parasite,2019,https://letterboxd.com/film/parasite-2019/,5
2023-02-20,The Matrix,1999,https://letterboxd.com/film/the-matrix/,4.5`;

    const result = parseLetterboxdCsv(csv);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      title: 'Parasite',
      year: 2019,
      letterboxdUri: 'https://letterboxd.com/film/parasite-2019/',
      letterboxdRating: 5,
    });
    expect(result[1]).toEqual({
      title: 'The Matrix',
      year: 1999,
      letterboxdUri: 'https://letterboxd.com/film/the-matrix/',
      letterboxdRating: 4.5,
    });
  });

  it('handles missing rating (empty field)', () => {
    const csv = `Date,Name,Year,Letterboxd URI,Rating
2023-01-15,Some Film,2020,https://letterboxd.com/film/some-film/,`;

    const result = parseLetterboxdCsv(csv);

    expect(result).toHaveLength(1);
    expect(result[0].letterboxdRating).toBeNull();
  });

  it('handles titles with commas (quoted fields)', () => {
    const csv = `Date,Name,Year,Letterboxd URI,Rating
2023-01-15,"Lock, Stock and Two Smoking Barrels",1998,https://letterboxd.com/film/lock-stock/,4`;

    const result = parseLetterboxdCsv(csv);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Lock, Stock and Two Smoking Barrels');
    expect(result[0].year).toBe(1998);
  });

  it('handles titles with quotes inside quoted fields', () => {
    const csv = `Date,Name,Year,Letterboxd URI,Rating
2023-01-15,"Who's Afraid of Virginia Woolf?",1966,https://letterboxd.com/film/whos-afraid/,5`;

    const result = parseLetterboxdCsv(csv);

    expect(result[0].title).toBe("Who's Afraid of Virginia Woolf?");
  });

  it('skips rows with missing required fields', () => {
    const csv = `Date,Name,Year,Letterboxd URI,Rating
2023-01-15,,2020,https://letterboxd.com/film/no-name/,4
2023-01-15,No Year,,https://letterboxd.com/film/no-year/,4
2023-01-15,No URI,2020,,4
2023-01-15,Valid Movie,2020,https://letterboxd.com/film/valid/,4`;

    const result = parseLetterboxdCsv(csv);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Valid Movie');
  });

  it('returns empty array for empty CSV', () => {
    const csv = `Date,Name,Year,Letterboxd URI,Rating`;
    const result = parseLetterboxdCsv(csv);
    expect(result).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    const result = parseLetterboxdCsv('');
    expect(result).toEqual([]);
  });

  it('trims whitespace from fields', () => {
    const csv = `Date,Name,Year,Letterboxd URI,Rating
2023-01-15, Parasite , 2019 , https://letterboxd.com/film/parasite/ , 5 `;

    const result = parseLetterboxdCsv(csv);

    expect(result[0].title).toBe('Parasite');
    expect(result[0].year).toBe(2019);
    expect(result[0].letterboxdRating).toBe(5);
  });

  it('handles Windows-style line endings (\\r\\n)', () => {
    const csv = "Date,Name,Year,Letterboxd URI,Rating\r\n2023-01-15,Parasite,2019,https://letterboxd.com/film/parasite/,5\r\n";

    const result = parseLetterboxdCsv(csv);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Parasite');
  });

  it('parses a large number of entries', () => {
    const header = 'Date,Name,Year,Letterboxd URI,Rating';
    const rows = Array.from({ length: 500 }, (_, i) =>
      `2023-01-01,Movie ${i},${2000 + (i % 24)},https://letterboxd.com/film/movie-${i}/,${(i % 5) + 1}`
    );
    const csv = [header, ...rows].join('\n');

    const result = parseLetterboxdCsv(csv);

    expect(result).toHaveLength(500);
  });
});
