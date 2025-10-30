import Papa from 'papaparse';

export function parseCsv(text) {
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (result.errors.length) {
    const messages = result.errors.map((error) => error.message).join(', ');
    throw new Error(`CSV parse error: ${messages}`);
  }
  return result.data;
}

export function toCsv(rows) {
  return Papa.unparse(rows, {
    quotes: false,
    delimiter: ',',
    header: true,
  });
}
