#!/usr/bin/env node
/*
  Convert Portuguese ANACOM-style repeater CSV to repeaters.json.
  - Handles quoted fields, embedded newlines, decimal commas
  - Parses DMS coordinates like: 37º 10' 20" ,600 N
  - Maps to schema used in src/repeaters.json
  - Pretty CLI with colors and prompts (no external deps)
*/

import fs from 'fs';
import path from 'path';
import { createInterface } from 'readline';

// --- Simple color helpers (no deps) ---
const colors = {
  reset: '\x1b[0m',
  bold: (s) => `\x1b[1m${s}${colors.reset}`,
  cyan: (s) => `\x1b[36m${s}${colors.reset}`,
  green: (s) => `\x1b[32m${s}${colors.reset}`,
  yellow: (s) => `\x1b[33m${s}${colors.reset}`,
  red: (s) => `\x1b[31m${s}${colors.reset}`,
  magenta: (s) => `\x1b[35m${s}${colors.reset}`,
  gray: (s) => `\x1b[90m${s}${colors.reset}`,
};

function banner() {
  const title = 'Repeater CSV → JSON';
  const line = '─'.repeat(title.length + 2);
  console.log(`\n${colors.cyan(`┌${line}┐`)}\n${colors.cyan(`│ ${colors.bold(title)} │`)}\n${colors.cyan(`└${line}┘`)}\n`);
}

// --- CSV parser (RFC-4180-ish) ---
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((c === '\n' || c === '\r') && !inQuotes) {
      // end of record (handle CRLF/CR/LF)
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  // flush last field/row if any
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// --- Helpers for Portuguese numeric formats and DMS coordinates ---
function cleanStr(s) {
  return (s ?? '').toString().trim().replace(/\s+/g, ' ');
}

function parsePtFloat(s) {
  if (!s) return undefined;
  const num = s.toString().replace(/\./g, '').replace(/,/g, '.');
  const m = num.match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : undefined;
}

function parseFrequencyMHz(s) {
  const v = parsePtFloat(s);
  return typeof v === 'number' ? v : undefined;
}

function parseToneHz(s) {
  const v = parsePtFloat(s);
  return typeof v === 'number' ? v : undefined;
}

function parseDMS(str) {
  if (!str) return undefined;
  const raw = str
    .toString()
    .replace(/\s+/g, '') // remove spaces
    .replace(/°/g, 'º');
  // Example: 37º10'20"",600N or 08º33'41"",920W
  const re = /^(\d{1,3})[^0-9]*(\d{1,2})[^0-9]*(\d{1,2})(?:[^0-9]+(\d+))?([NSEW])?$/i;
  const m = raw.match(re);
  if (!m) return undefined;
  const deg = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const secInt = parseInt(m[3], 10);
  const secFrac = m[4] ? parseFloat('0.' + m[4]) : 0;
  const dir = (m[5] || '').toUpperCase();
  const seconds = secInt + secFrac;
  let dec = deg + min / 60 + seconds / 3600;
  if (dir === 'S' || dir === 'W') dec = -dec;
  return dec;
}

function inferModulation(typeStr) {
  const s = (typeStr || '').toLowerCase();
  if (s.includes('analógica')) return 'FM';
  if (s.includes('dmr')) return 'DMR';
  if (s.includes('d-star') || s.includes('dstar')) return 'D-STAR';
  if (s.includes('c4fm') || s.includes('fusion')) return 'C4FM';
  if (s.includes('digital')) return 'DIGITAL';
  return 'FM';
}

// Normalize Portuguese header labels: remove diacritics, punctuation, lowercase
function normalizeKey(s) {
  return cleanStr(s)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// --- Mapping function ---
function mapRowToRepeater(headersRaw, row) {
  const headers = headersRaw.map((h) => normalizeKey(h));
  const findIdx = (aliases) => {
    const list = Array.isArray(aliases) ? aliases : [aliases];
    for (const a of list.map(normalizeKey)) {
      const i = headers.indexOf(a);
      if (i !== -1) return i;
    }
    return -1;
  };
  const getBy = (aliases) => {
    const i = findIdx(aliases);
    return i >= 0 ? row[i] ?? '' : '';
  };

  const owner = cleanStr(getBy(['Entidade Titular']));
  const callsign = cleanStr(getBy(['Indicativo de Chamada']));
  const tipo = cleanStr(getBy(['Tipo de Estacao', 'Tipo de Estação']));
  const outputStr = cleanStr(
    getBy([
      'Frequencia de Emissao',
      'Frequência de Emissão',
      'Frequencia Emissao',
      'Frequencia de Transmissao',
      'Frequência de Transmissão',
    ])
  );
  const inputStr = cleanStr(
    getBy([
      'Frequencia de Rececao',
      'Frequência de Receção',
      'Frequencia de Recepcao',
      'Frequência de Recepção',
    ])
  );
  const toneStr = cleanStr(getBy(['Tom de Protecao', 'Tom de proteção', 'CTCSS', 'Tom']));
  const locator = cleanStr(getBy(['Local da Estacao', 'Local da Estação', 'QTH', 'QTH Locator']));
  const latStr = cleanStr(getBy(['Latitude']));
  const lonStr = cleanStr(getBy(['Longitude']));

  const outputFrequency = parseFrequencyMHz(outputStr);
  const inputFrequency = parseFrequencyMHz(inputStr);
  const tone = parseToneHz(toneStr);
  const modulation = inferModulation(tipo);
  const latitude = parseDMS(latStr);
  const longitude = parseDMS(lonStr);

  return {
    callsign,
    outputFrequency,
    inputFrequency,
    tone,
    modulation,
    latitude,
    longitude,
    qth_locator: locator || undefined,
    owner,
  };
}

function validateRepeater(r) {
  const problems = [];
  if (!r.callsign) problems.push('callsign');
  if (typeof r.outputFrequency !== 'number') problems.push('outputFrequency');
  if (typeof r.inputFrequency !== 'number') problems.push('inputFrequency');
  if (typeof r.latitude !== 'number') problems.push('latitude');
  if (typeof r.longitude !== 'number') problems.push('longitude');
  return problems;
}

// --- CLI ---
async function main() {
  banner();

  const args = process.argv.slice(2);
  const inputFlagIdx = args.findIndex((a) => a === '--input' || a === '-i');
  const inputPath = inputFlagIdx >= 0 ? args[inputFlagIdx + 1] : args[0];
  const encFlagIdx = args.findIndex((a) => a === '--encoding' || a === '-e');
  const forcedEncoding = encFlagIdx >= 0 ? (args[encFlagIdx + 1] || '').toLowerCase() : '';
  if (!inputPath) {
    console.log(colors.yellow('Usage: node scripts/convert-repeaters-csv.js --input <file.csv> [--encoding utf8|latin1]'));
    process.exit(1);
  }

  const absPath = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(absPath)) {
    console.error(colors.red(`File not found: ${absPath}`));
    process.exit(1);
  }

  console.log(colors.gray(`Reading: ${absPath}`));
  const buf = fs.readFileSync(absPath);
  const decode = (enc) => {
    try {
      return buf.toString(enc);
    } catch {
      return null;
    }
  };

  let text = null;
  let usedEncoding = 'utf8';
  if (forcedEncoding) {
    const t = decode(forcedEncoding);
    if (!t) {
      console.error(colors.red(`Unsupported encoding: ${forcedEncoding}`));
      process.exit(1);
    }
    text = t;
    usedEncoding = forcedEncoding;
  } else {
    let t = decode('utf8');
    // If replacement chars present in header or key words missing, try latin1
    const headSample = t ? t.slice(0, 2048) : '';
    const hasReplacement = headSample.includes('\uFFFD') || headSample.includes('�');
    const looksPortuguese = /Frequ[eê]ncia|Est[aã]o|Entidade|Indicativo/i.test(headSample);
    if (!t || hasReplacement || !looksPortuguese) {
      const t2 = decode('latin1');
      if (t2) {
        text = t2;
        usedEncoding = 'latin1';
      } else {
        text = t || '';
      }
    } else {
      text = t;
    }
  }

  const rows = parseCSV(text).filter((r) => r.length && r.some((c) => c && c.trim() !== ''));
  if (rows.length < 2) {
    console.error(colors.red('CSV appears to have no data rows.'));
    process.exit(1);
  }

  const headers = rows[0].map((h) => cleanStr(h));
  const dataRows = rows.slice(1);

  const mapped = [];
  const issues = [];
  for (const row of dataRows) {
    const rep = mapRowToRepeater(headers, row);
    const problems = validateRepeater(rep);
    if (problems.length) {
      issues.push({ rep, problems });
      // Keep but mark incomplete? We'll skip invalid rows.
    } else {
      mapped.push(rep);
    }
  }

  console.log(colors.green(`Parsed ${dataRows.length} rows [${usedEncoding}] → valid ${mapped.length}, skipped ${issues.length}.`));
  if (issues.length) {
    console.log(colors.yellow('Skipped examples:'));
    for (const { rep, problems } of issues.slice(0, 3)) {
      console.log('  -', colors.yellow(problems.join(', ')), colors.gray(JSON.stringify(rep)));
    }
    if (issues.length > 3) console.log(colors.gray(`  ... and ${issues.length - 3} more`));
  }

  console.log(colors.cyan('\nPreview (first 3):'));
  console.log(JSON.stringify(mapped.slice(0, 3), null, 2));

  const outPath = path.resolve(process.cwd(), 'src/repeaters.json');
  const backupPath = outPath.replace(/\.json$/, `.backup.${Date.now()}.json`);

  // Prompt for confirmation
  await new Promise((resolve) => setTimeout(resolve, 50));
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  rl.question(colors.bold(`\nReplace ${outPath} with ${mapped.length} entries? (y/N) `), (answer) => {
    const a = (answer || '').trim().toLowerCase();
    if (a !== 'y' && a !== 'yes') {
      console.log(colors.yellow('Aborted. No files were changed.'));
      rl.close();
      process.exit(0);
    }
    try {
      if (fs.existsSync(outPath)) {
        fs.copyFileSync(outPath, backupPath);
        console.log(colors.gray(`Backup created: ${backupPath}`));
      }
      fs.writeFileSync(outPath, JSON.stringify(mapped, null, 2) + '\n', 'utf8');
      console.log(colors.green(`Wrote ${mapped.length} entries to ${outPath}`));
    } catch (err) {
      console.error(colors.red('Failed to write file:'), err.message);
      process.exit(1);
    } finally {
      rl.close();
    }
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error(colors.red('Unexpected error:'), err);
    process.exit(1);
  });
}
