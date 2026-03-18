export interface LetterboxdEntry {
  title: string;
  year: number;
  letterboxdUri: string;
  letterboxdRating: number | null;
}

/**
 * Parse a row respecting CSV quoting rules: fields wrapped in double quotes
 * can contain commas and escaped quotes ("").
 */
function parseCsvRow(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

export function parseLetterboxdCsv(csvContent: string): LetterboxdEntry[] {
  if (!csvContent.trim()) return [];

  const lines = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const headerLine = lines[0];
  if (!headerLine) return [];

  const headers = parseCsvRow(headerLine).map((h) => h.trim());
  const nameIdx = headers.indexOf('Name');
  const yearIdx = headers.indexOf('Year');
  const uriIdx = headers.indexOf('Letterboxd URI');
  const ratingIdx = headers.indexOf('Rating');

  if (nameIdx === -1 || yearIdx === -1 || uriIdx === -1) return [];

  const entries: LetterboxdEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCsvRow(line);
    const title = fields[nameIdx]?.trim();
    const yearStr = fields[yearIdx]?.trim();
    const uri = fields[uriIdx]?.trim();
    const ratingStr = ratingIdx >= 0 ? fields[ratingIdx]?.trim() : '';

    if (!title || !yearStr || !uri) continue;

    const year = parseInt(yearStr, 10);
    if (isNaN(year)) continue;

    const rating = ratingStr ? parseFloat(ratingStr) : null;
    const letterboxdRating = rating !== null && !isNaN(rating) ? rating : null;

    entries.push({ title, year, letterboxdUri: uri, letterboxdRating });
  }

  return entries;
}
