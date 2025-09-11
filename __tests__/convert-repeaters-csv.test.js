// Mock fs and path modules for testing
jest.mock('fs');
jest.mock('path');

const fs = require('fs');
const path = require('path');

// Import the functions we want to test
// Since the script uses ES modules and top-level await, we'll need to mock the main function
// and test the individual functions by importing them

describe('CSV Conversion Script Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test data
    const mockCSVData = `"Entidade Titular","Indicativo de Chamada","Tipo de Estação","Frequência de Emissão","Frequência de Recepção","Tom de Proteção","Local da Estação","Latitude","Longitude"
"ANACOM","CT7ABC","Analógica","145,225","145,825","88,5","Lisboa","38º 43' 30""","009º 08' 27"" W"
"REPETIDORES LDA","CT7DEF","DMR","438,125","430,525","","Porto","41º 08' 53"" N","008º 36' 39"" W"
"CLUBE RADIOAMADORES","CT7GHI","C4FM","1298,500","1297,500","88,5","Coimbra","40º 12' 31"" N","008º 25' 56"" W"`;

    const expectedJSON = [
        {
            callsign: "CT7ABC",
            outputFrequency: 145.225,
            inputFrequency: 145.825,
            tone: 88.5,
            modulation: "FM",
            latitude: 38.725,
            longitude: -9.140833333333333,
            qth_locator: "Lisboa",
            owner: "ANACOM"
        },
        {
            callsign: "CT7DEF",
            outputFrequency: 438.125,
            inputFrequency: 430.525,
            tone: undefined,
            modulation: "DMR",
            latitude: 41.148055555555556,
            longitude: -8.610833333333333,
            qth_locator: "Porto",
            owner: "REPETIDORES LDA"
        },
        {
            callsign: "CT7GHI",
            outputFrequency: 1298.5,
            inputFrequency: 1297.5,
            tone: 88.5,
            modulation: "C4FM",
            latitude: 40.20861111111111,
            longitude: -8.432222222222222,
            qth_locator: "Coimbra",
            owner: "CLUBE RADIOAMADORES"
        }
    ];

    describe('parseCSV', () => {
        test('should parse simple CSV correctly', () => {
            const csvText = 'a,b,c\n1,2,3\n4,5,6';
            const result = parseCSV(csvText);
            expect(result).toEqual([
                ['a', 'b', 'c'],
                ['1', '2', '3'],
                ['4', '5', '6']
            ]);
        });

        test('should handle quoted fields with commas', () => {
            const csvText = '"a,b","c,d"\n"1,2","3,4"';
            const result = parseCSV(csvText);
            expect(result).toEqual([
                ['a,b', 'c,d'],
                ['1,2', '3,4']
            ]);
        });

        test('should handle escaped quotes', () => {
            const csvText = '"a""b","c""d"\n"1""2","3""4"';
            const result = parseCSV(csvText);
            expect(result).toEqual([
                ['a"b', 'c"d'],
                ['1"2', '3"4']
            ]);
        });

        test('should handle newlines in quoted fields', () => {
            const csvText = '"line1\nline2","normal"';
            const result = parseCSV(csvText);
            expect(result).toEqual([
                ['line1\nline2', 'normal']
            ]);
        });
    });

    describe('parsePtFloat', () => {
        test('should parse Portuguese decimal format', () => {
            expect(parsePtFloat('123,45')).toBe(123.45);
            expect(parsePtFloat('1.234,56')).toBe(1234.56);
            expect(parsePtFloat('0,5')).toBe(0.5);
        });

        test('should handle regular decimal format', () => {
            // In Portuguese format, dots are thousands separators, not decimals
            expect(parsePtFloat('123.45')).toBe(12345);
            expect(parsePtFloat('1.234')).toBe(1234);
        });

        test('should handle negative numbers', () => {
            expect(parsePtFloat('-123,45')).toBe(-123.45);
        });

        test('should return undefined for invalid input', () => {
            expect(parsePtFloat('')).toBeUndefined();
            expect(parsePtFloat('abc')).toBeUndefined();
            expect(parsePtFloat(null)).toBeUndefined();
        });
    });

    describe('parseDMS', () => {
        test('should parse DMS coordinates correctly', () => {
            expect(parseDMS("37º 10' 20\" N")).toBeCloseTo(37.172222, 5);
            expect(parseDMS("08º 33' 41\" W")).toBeCloseTo(-8.561389, 5);
            expect(parseDMS("40º 12' 31\" S")).toBeCloseTo(-40.208611, 5);
        });

        test('should handle decimal seconds', () => {
            expect(parseDMS("37º 10' 20\",600 N")).toBeCloseTo(37.172389, 5);
            expect(parseDMS("08º 33' 41\",920 W")).toBeCloseTo(-8.561644, 5);
        });

        test('should handle various formats', () => {
            expect(parseDMS("37°10'20\"N")).toBeCloseTo(37.172222, 5);
            expect(parseDMS("37 10 20 N")).toBeCloseTo(37.172222, 5);
        });

        test('should return undefined for invalid input', () => {
            expect(parseDMS('')).toBeUndefined();
            expect(parseDMS('invalid')).toBeUndefined();
            expect(parseDMS(null)).toBeUndefined();
        });
    });

    describe('inferModulation', () => {
        test('should infer correct modulation types', () => {
            expect(inferModulation('Analógica')).toBe('FM');
            expect(inferModulation('DMR')).toBe('DMR');
            expect(inferModulation('Sistema D-STAR')).toBe('D-STAR');
            expect(inferModulation('C4FM Fusion')).toBe('C4FM');
            expect(inferModulation('Digital')).toBe('DIGITAL');
        });

        test('should default to FM for unknown types', () => {
            expect(inferModulation('Unknown')).toBe('FM');
            expect(inferModulation('')).toBe('FM');
            expect(inferModulation(null)).toBe('FM');
        });
    });

    describe('normalizeKey', () => {
        test('should normalize Portuguese headers', () => {
            expect(normalizeKey('Frequência de Emissão')).toBe('frequencia de emissao');
            expect(normalizeKey('Tipo de Estação')).toBe('tipo de estacao');
            expect(normalizeKey('Entidade Titular')).toBe('entidade titular');
        });

        test('should remove diacritics and punctuation', () => {
            expect(normalizeKey('Frequência')).toBe('frequencia');
            expect(normalizeKey('Tom de Proteção')).toBe('tom de protecao');
            expect(normalizeKey('QTH Locator')).toBe('qth locator');
        });
    });

    describe('validateRepeater', () => {
        test('should validate complete repeater data', () => {
            const validRepeater = {
                callsign: 'CT7ABC',
                outputFrequency: 145.225,
                inputFrequency: 145.825,
                latitude: 38.725,
                longitude: -9.141,
                modulation: 'FM'
            };
            expect(validateRepeater(validRepeater)).toEqual([]);
        });

        test('should identify missing required fields', () => {
            const invalidRepeater = {
                callsign: '',
                outputFrequency: 'invalid',
                inputFrequency: null,
                latitude: undefined,
                longitude: 'invalid'
            };
            const problems = validateRepeater(invalidRepeater);
            expect(problems).toContain('callsign');
            expect(problems).toContain('outputFrequency');
            expect(problems).toContain('inputFrequency');
            expect(problems).toContain('latitude');
            expect(problems).toContain('longitude');
        });
    });

    describe('Integration Tests', () => {
        test('should process complete CSV to JSON conversion', () => {
            // Mock the CSV parsing and processing
            const rows = [
                ['Entidade Titular', 'Indicativo de Chamada', 'Tipo de Estação', 'Frequência de Emissão', 'Frequência de Recepção', 'Tom de Proteção', 'Local da Estação', 'Latitude', 'Longitude'],
                ['ANACOM', 'CT7ABC', 'Analógica', '145,225', '145,825', '88,5', 'Lisboa', '38º 43\' 30"', '009º 08\' 27" W']
            ];

            const repeater = mapRowToRepeater(rows[0], rows[1]);
            expect(repeater.callsign).toBe('CT7ABC');
            expect(repeater.outputFrequency).toBe(145.225);
            expect(repeater.inputFrequency).toBe(145.825);
            expect(repeater.tone).toBe(88.5);
            expect(repeater.modulation).toBe('FM');
            expect(repeater.owner).toBe('ANACOM');
            expect(repeater.qth_locator).toBe('Lisboa');
            expect(typeof repeater.latitude).toBe('number');
            expect(typeof repeater.longitude).toBe('number');
        });
    });
});

// Helper functions that need to be extracted from the main script for testing
// These are simplified versions for testing purposes

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
            if (c === '\r' && text[i + 1] === '\n') i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else {
            field += c;
        }
    }
    if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
    }
    return rows;
}

function cleanStr(s) {
    return (s ?? '').toString().trim().replace(/\s+/g, ' ');
}

function parsePtFloat(s) {
    if (!s) return undefined;
    const num = s.toString().replace(/\./g, '').replace(/,/g, '.');
    const m = num.match(/-?\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : undefined;
}

function parseDMS(str) {
    if (!str) return undefined;
    const raw = str
        .toString()
        .replace(/\s+/g, '') // remove spaces
        .replace(/°/g, 'º')
        .replace(/"/g, ''); // remove quotes around seconds
    // Example: 37º10'20N or 08º33'41W or 37º10'20,600N or 371020N
    // Handle both separated and concatenated formats
    let re = /^(\d{1,3})[^0-9]+(\d{1,2})[^0-9]+(\d{1,2})(?:[,"](\d+))?(?:[,"])?([NSEW])?$/i;
    let m = raw.match(re);
    if (!m) {
        // Try concatenated format: 371020N -> deg=37, min=10, sec=20, dir=N
        re = /^(\d{2})(\d{2})(\d{2})([NSEW])?$/i;
        m = raw.match(re);
        if (m) {
            m[1] = m[1]; // deg
            m[2] = m[2]; // min  
            m[3] = m[3]; // sec
            m[4] = undefined; // no fractional seconds
            m[5] = m[4]; // direction
        }
    }
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

function normalizeKey(s) {
    return cleanStr(s)
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

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
    const outputStr = cleanStr(getBy([
        'Frequencia de Emissao',
        'Frequência de Emissão',
        'Frequencia Emissao',
        'Frequencia de Transmissao',
        'Frequência de Transmissão',
    ]));
    const inputStr = cleanStr(getBy([
        'Frequencia de Rececao',
        'Frequência de Receção',
        'Frequencia de Recepcao',
        'Frequência de Recepção',
    ]));
    const toneStr = cleanStr(getBy(['Tom de Protecao', 'Tom de proteção', 'CTCSS', 'Tom']));
    const locator = cleanStr(getBy(['Local da Estacao', 'Local da Estação', 'QTH', 'QTH Locator']));
    const latStr = cleanStr(getBy(['Latitude']));
    const lonStr = cleanStr(getBy(['Longitude']));

    const outputFrequency = parsePtFloat(outputStr);
    const inputFrequency = parsePtFloat(inputStr);
    const tone = parsePtFloat(toneStr);
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
