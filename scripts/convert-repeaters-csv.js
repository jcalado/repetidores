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
import { fileURLToPath } from 'url';

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
  const raw = s
    .toString()
    .trim()
    .replace(/\s+/g, '');
  const hasComma = raw.includes(',');
  const hasDot = raw.includes('.');
  let num = raw;
  if (hasComma && hasDot) {
    // Assume thousand separators with dot and decimal comma
    num = raw.replace(/\./g, '').replace(/,/g, '.');
  } else if (hasComma) {
    num = raw.replace(/,/g, '.');
  }
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

function parseDMS(str, defaultDir = '') {
  if (!str) return undefined;
  let input = str.toString().trim();
  if (!input) return undefined;

  const dirMatch = input.match(/[NSEW]/i);
  let dir = dirMatch ? dirMatch[0].toUpperCase() : '';
  if (!dir && defaultDir) dir = defaultDir.toUpperCase();

  input = input
    .replace(/[NSEW]/gi, ' ')
    .replace(/°/g, ' ')
    .replace(/º/g, ' ')
    .replace(/["“”″]+/g, '')
    .replace(/[\'’′]/g, ' ')
    .replace(/,/g, '.')
    .replace(/\s+/g, ' ')
    .trim();

  const numbers = input.match(/-?\d+(?:\.\d+)?/g);
  if (!numbers || !numbers.length) return undefined;

  const deg = parseFloat(numbers[0]);
  const min = numbers.length > 1 ? parseFloat(numbers[1]) : 0;
  const sec = numbers.length > 2 ? parseFloat(numbers[2]) : 0;

  if ([deg, min, sec].some((n) => Number.isNaN(n))) return undefined;

  let dec = deg + min / 60 + sec / 3600;
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

function normalizeCallsign(s) {
  return cleanStr(s)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function extractDefaultDirection(header) {
  if (!header) return '';
  const upper = header.toUpperCase();
  if (upper.includes(' N')) return 'N';
  if (upper.includes(' S')) return 'S';
  if (upper.includes(' E')) return 'E';
  if (upper.includes(' W')) return 'W';
  return '';
}

function loadSupplementalRepeaters(csvPath, { modulation, dmr, dstar }) {
  const set = new Set();
  const map = new Map();
  if (!fs.existsSync(csvPath)) {
    return { set, map };
  }
  const text = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(text).filter((r) => r.length && r.some((c) => c && c.trim() !== ''));
  if (rows.length < 2) {
    return { set, map };
  }
  const headers = rows[0].map((h) => cleanStr(h));
  const headersNorm = headers.map((h) => normalizeKey(h));
  const findIdx = (aliases) => {
    const list = Array.isArray(aliases) ? aliases : [aliases];
    for (const alias of list.map(normalizeKey)) {
      const idx = headersNorm.indexOf(alias);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxIndicativo = findIdx(['indicativo']);
  const idxOutput = findIdx(['saida', 'frequencia de saida']);
  const idxInput = findIdx(['entrada', 'frequencia de entrada']);
  const idxLat = findIdx(['latitude n', 'latitude']);
  const idxLon = findIdx(['longitude w', 'longitude']);
  const idxOwner = findIdx(['titular', 'entidade']);
  const idxLocation = findIdx(['localizacao', 'localização', 'local']);

  const latHeaderRaw = idxLat >= 0 ? headers[idxLat] : '';
  const lonHeaderRaw = idxLon >= 0 ? headers[idxLon] : '';
  const latDefault = extractDefaultDirection(latHeaderRaw);
  const lonDefault = extractDefaultDirection(lonHeaderRaw);

  if (idxIndicativo === -1 || idxOutput === -1 || idxInput === -1 || idxLat === -1 || idxLon === -1) {
    return { set, map };
  }

  for (const row of rows.slice(1)) {
    const callsignRaw = cleanStr(row[idxIndicativo]);
    const key = normalizeCallsign(callsignRaw);
    if (!key) continue;
    const callsign = key;

    const outputFrequency = parseFrequencyMHz(cleanStr(row[idxOutput]));
    const inputFrequency = parseFrequencyMHz(cleanStr(row[idxInput]));
    const latitude = parseDMS(cleanStr(row[idxLat]), latDefault);
    const longitude = parseDMS(cleanStr(row[idxLon]), lonDefault);

    const ownerRaw = idxOwner >= 0 ? cleanStr(row[idxOwner]) : '';
    const locationRaw = idxLocation >= 0 ? cleanStr(row[idxLocation]) : '';

    const repeater = {
      callsign,
      outputFrequency,
      inputFrequency,
      tone: undefined,
      modulation,
      latitude,
      longitude,
      qth_locator: undefined,
      owner: ownerRaw || locationRaw || 'Desconhecido',
      dmr: Boolean(dmr),
      dstar: Boolean(dstar),
    };

    set.add(key);

    if (map.has(key)) {
      const existing = map.get(key);
      existing.dmr = existing.dmr || repeater.dmr;
      existing.dstar = existing.dstar || repeater.dstar;
      const mods = new Set();
      if (existing.modulation) mods.add(existing.modulation);
      if (repeater.modulation) mods.add(repeater.modulation);
      existing.modulation = Array.from(mods).join(' / ') || existing.modulation || repeater.modulation;
      if (existing.qth_locator == null && repeater.qth_locator) existing.qth_locator = repeater.qth_locator;
      if (!existing.owner && repeater.owner) existing.owner = repeater.owner;
      if (typeof existing.outputFrequency !== 'number' && typeof repeater.outputFrequency === 'number') existing.outputFrequency = repeater.outputFrequency;
      if (typeof existing.inputFrequency !== 'number' && typeof repeater.inputFrequency === 'number') existing.inputFrequency = repeater.inputFrequency;
      if (typeof existing.latitude !== 'number' && typeof repeater.latitude === 'number') existing.latitude = repeater.latitude;
      if (typeof existing.longitude !== 'number' && typeof repeater.longitude === 'number') existing.longitude = repeater.longitude;
    } else {
      map.set(key, repeater);
    }
  }

  return { set, map };
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
    dmr: false,
    dstar: false,
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

  const dmrPath = path.resolve(process.cwd(), 'data/dmr.csv');
  const dstarPath = path.resolve(process.cwd(), 'data/dstar.csv');
  const dmrSupplement = loadSupplementalRepeaters(dmrPath, { modulation: 'DMR', dmr: true, dstar: false });
  const dstarSupplement = loadSupplementalRepeaters(dstarPath, { modulation: 'D-STAR', dmr: false, dstar: true });
  const dmrCallsigns = dmrSupplement.set;
  const dstarCallsigns = dstarSupplement.set;
  if (dmrCallsigns.size || dstarCallsigns.size) {
    console.log(
      colors.gray(
        `Loaded ${dmrCallsigns.size} DMR callsigns and ${dstarCallsigns.size} D-STAR callsigns for cross-check.`
      )
    );
  } else {
    console.log(colors.yellow('No DMR/D-STAR callsigns loaded (check data CSV files if expected).'));
  }

  const mapped = [];
  const issues = [];
  const existingKeys = new Set();
  for (const row of dataRows) {
    const rep = mapRowToRepeater(headers, row);
    const callsignKey = normalizeCallsign(rep.callsign);
    if (callsignKey) {
      rep.dmr = dmrCallsigns.has(callsignKey);
      rep.dstar = dstarCallsigns.has(callsignKey);
    }
    const problems = validateRepeater(rep);
    if (problems.length) {
      issues.push({ rep, problems });
      // Keep but mark incomplete? We'll skip invalid rows.
    } else {
      mapped.push(rep);
      if (callsignKey) existingKeys.add(callsignKey);
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

  const supplementalCombined = new Map();
  for (const [key, rep] of dmrSupplement.map.entries()) {
    supplementalCombined.set(key, { ...rep });
  }
  for (const [key, rep] of dstarSupplement.map.entries()) {
    if (supplementalCombined.has(key)) {
      const existing = supplementalCombined.get(key);
      existing.dstar = existing.dstar || rep.dstar;
      existing.dmr = existing.dmr || rep.dmr;
      const mods = new Set();
      if (existing.modulation) existing.modulation.split('/').map((m) => m.trim()).forEach((m) => mods.add(m));
      if (rep.modulation) rep.modulation.split('/').map((m) => m.trim()).forEach((m) => mods.add(m));
      existing.modulation = Array.from(mods).join(' / ') || existing.modulation || rep.modulation;
      if (!existing.owner && rep.owner) existing.owner = rep.owner;
      if (!existing.qth_locator && rep.qth_locator) existing.qth_locator = rep.qth_locator;
      if (typeof existing.outputFrequency !== 'number' && typeof rep.outputFrequency === 'number') existing.outputFrequency = rep.outputFrequency;
      if (typeof existing.inputFrequency !== 'number' && typeof rep.inputFrequency === 'number') existing.inputFrequency = rep.inputFrequency;
      if (typeof existing.latitude !== 'number' && typeof rep.latitude === 'number') existing.latitude = rep.latitude;
      if (typeof existing.longitude !== 'number' && typeof rep.longitude === 'number') existing.longitude = rep.longitude;
    } else {
      supplementalCombined.set(key, { ...rep });
    }
  }

  const supplementalAdded = [];
  const supplementalSkipped = [];
  for (const [key, rep] of supplementalCombined.entries()) {
    if (existingKeys.has(key)) continue;
    const problems = validateRepeater(rep);
    if (problems.length) {
      supplementalSkipped.push({ rep, problems });
      continue;
    }
    mapped.push(rep);
    existingKeys.add(key);
    supplementalAdded.push(rep.callsign);
  }

  if (supplementalAdded.length) {
    console.log(colors.green(`Added ${supplementalAdded.length} supplemental repeaters from DMR/D-STAR lists.`));
    console.log(colors.gray(`  ${supplementalAdded.slice(0, 5).join(', ')}${supplementalAdded.length > 5 ? '…' : ''}`));
  }
  if (supplementalSkipped.length) {
    console.log(colors.yellow('Supplemental entries skipped (missing required data):'));
    for (const { rep, problems } of supplementalSkipped.slice(0, 3)) {
      console.log('  -', colors.yellow(problems.join(', ')), colors.gray(JSON.stringify(rep)));
    }
    if (supplementalSkipped.length > 3) console.log(colors.gray(`  ... and ${supplementalSkipped.length - 3} more`));
  }

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

const isDirectExecution = () => {
  try {
    const thisFile = fileURLToPath(import.meta.url);
    const invoked = process.argv[1] ? path.resolve(process.argv[1]) : '';
    return thisFile === invoked;
  } catch {
    return false;
  }
};

if (isDirectExecution()) {
  main().catch((err) => {
    console.error(colors.red('Unexpected error:'), err);
    process.exit(1);
  });
}
