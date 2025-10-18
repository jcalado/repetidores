// Mock fs and path modules
jest.mock('fs');
jest.mock('path');

const fs = require('fs');
const path = require('path');

describe('CSV Conversion End-to-End Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const sampleCSV = `"Entidade Titular","Indicativo de Chamada","Tipo de Estação","Frequência de Emissão","Frequência de Recepção","Tom de Proteção","Local da Estação","Latitude","Longitude"
"ANACOM","CT7ABC","Analógica","145,225","145,825","88,5","Lisboa","38º 43' 30""","009º 08' 27"" W"
"REPETIDORES LDA","CT7DEF","DMR","438,125","430,525","","Porto","41º 08' 53"" N","008º 36' 39"" W"
"CLUBE RADIOAMADORES","CT7GHI","C4FM","1298,500","1297,500","88,5","Coimbra","40º 12' 31"" N","008º 25' 56"" W"
"ASSOCIAÇÃO HAM","CT7JKL","Sistema D-STAR","145,287","145,887","","Évora","38º 34' 12"" N","007º 54' 28"" W"
"Tecnologia Digital","CT7MNO","Digital","438,800","431,200","","Faro","37º 01' 27"" N","007º 55' 52"" W"`;

    const expectedOutput = [
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
        },
        {
            callsign: "CT7JKL",
            outputFrequency: 145.287,
            inputFrequency: 145.887,
            tone: undefined,
            modulation: "D-STAR",
            latitude: 38.57,
            longitude: -7.907777777777778,
            qth_locator: "Évora",
            owner: "ASSOCIAÇÃO HAM"
        },
        {
            callsign: "CT7MNO",
            outputFrequency: 438.8,
            inputFrequency: 431.2,
            tone: undefined,
            modulation: "DIGITAL",
            latitude: 37.024166666666666,
            longitude: -7.931111111111111,
            qth_locator: "Faro",
            owner: "Tecnologia Digital"
        }
    ];

    test('should convert complete ANACOM CSV to expected JSON format', () => {
        const rows = parseCSV(sampleCSV);
        expect(rows.length).toBe(6); // 5 data rows + 1 header row

        const headers = rows[0];
        const dataRows = rows.slice(1);

        const result = [];
        for (const row of dataRows) {
            const repeater = mapRowToRepeater(headers, row);
            result.push(repeater);
        }

        // Verify structure and key fields
        expect(result).toHaveLength(5);
        result.forEach((repeater, index) => {
            const expected = expectedOutput[index];
            expect(repeater.callsign).toBe(expected.callsign);
            expect(repeater.outputFrequency).toBe(expected.outputFrequency);
            expect(repeater.inputFrequency).toBe(expected.inputFrequency);
            expect(repeater.modulation).toBe(expected.modulation);
            expect(repeater.owner).toBe(expected.owner);
            expect(repeater.qth_locator).toBe(expected.qth_locator);

            // Verify coordinate precision (allowing for small floating point differences)
            expect(repeater.latitude).toBeCloseTo(expected.latitude, 5);
            expect(repeater.longitude).toBeCloseTo(expected.longitude, 5);

            // Verify tone handling (some entries don't have tones)
            if (expected.tone !== undefined) {
                expect(repeater.tone).toBe(expected.tone);
            } else {
                expect(repeater.tone).toBeUndefined();
            }
        });
    });

    test('should handle edge cases in CSV data', () => {
        const edgeCaseCSV = `"Entidade Titular","Indicativo de Chamada","Tipo de Estação","Frequência de Emissão","Frequência de Recepção","Tom de Proteção","Local da Estação","Latitude","Longitude"
"Test Entity","CT7TEST","Analógica","145,000","145,600","67","Test Location","37º 00' 00"" N","008º 00' 00"" W"
"","","","","","","","",""
"Entity with, comma","CT7COMMA","DMR","438,000","430,400","","Location, with comma","37º 30' 00"" N","008º 30' 00"" W"`;

        const rows = parseCSV(edgeCaseCSV);
        expect(rows.length).toBe(4); // 3 data rows + 1 header row

        // Test empty row handling
        const emptyRow = rows[2];
        const emptyRepeater = mapRowToRepeater(rows[0], emptyRow);
        expect(emptyRepeater.callsign).toBe('');
        expect(emptyRepeater.outputFrequency).toBeUndefined();

        // Test comma in quoted fields
        const commaRow = rows[3];
        const commaRepeater = mapRowToRepeater(rows[0], commaRow);
        expect(commaRepeater.owner).toBe('Entity with, comma');
        expect(commaRepeater.qth_locator).toBe('Location, with comma');
    });

    test('should validate repeater data correctly', () => {
        const validRepeater = {
            callsign: 'CT7ABC',
            outputFrequency: 145.225,
            inputFrequency: 145.825,
            latitude: 38.725,
            longitude: -9.141,
            modulation: 'FM'
        };

        const invalidRepeater = {
            callsign: '',
            outputFrequency: 'invalid',
            inputFrequency: null,
            latitude: undefined,
            longitude: 'invalid'
        };

        expect(validateRepeater(validRepeater)).toEqual([]);
        expect(validateRepeater(invalidRepeater)).toEqual([
            'callsign',
            'outputFrequency',
            'inputFrequency',
            'latitude',
            'longitude'
        ]);
    });

    test('should handle various Portuguese number formats', () => {
        expect(parsePtFloat('123,45')).toBe(123.45);
        expect(parsePtFloat('1.234,56')).toBe(1234.56);
        expect(parsePtFloat('0,5')).toBe(0.5);
        expect(parsePtFloat('123.45')).toBe(12345);
        expect(parsePtFloat('-123,45')).toBe(-123.45);
        expect(parsePtFloat('')).toBeUndefined();
        expect(parsePtFloat('abc')).toBeUndefined();
    });

    test('should handle various DMS coordinate formats', () => {
        expect(parseDMS("37º 10' 20\" N")).toBeCloseTo(37.172222, 5);
        expect(parseDMS("08º 33' 41\" W")).toBeCloseTo(-8.561389, 5);
        expect(parseDMS("37º 10' 20\",600 N")).toBeCloseTo(37.172389, 5);
        expect(parseDMS("37°10'20\"N")).toBeCloseTo(37.172222, 5);
        expect(parseDMS("37 10 20 N")).toBeCloseTo(37.172222, 5);
        expect(parseDMS('')).toBeUndefined();
        expect(parseDMS('invalid')).toBeUndefined();
    });

    test('should generate valid JSON output format', () => {
        const rows = parseCSV(sampleCSV);
        const headers = rows[0];
        const dataRows = rows.slice(1);

        const result = [];
        for (const row of dataRows) {
            const repeater = mapRowToRepeater(headers, row);
            if (validateRepeater(repeater).length === 0) {
                result.push(repeater);
            }
        }

        // Verify the JSON can be serialized
        const jsonString = JSON.stringify(result, null, 2);
        expect(jsonString).toBeDefined();
        expect(() => JSON.parse(jsonString)).not.toThrow();

        // Verify structure matches expected schema
        const parsed = JSON.parse(jsonString);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed.length).toBeGreaterThan(0);

        parsed.forEach(repeater => {
            expect(repeater).toHaveProperty('callsign');
            expect(repeater).toHaveProperty('outputFrequency');
            expect(repeater).toHaveProperty('inputFrequency');
            expect(repeater).toHaveProperty('latitude');
            expect(repeater).toHaveProperty('longitude');
            expect(repeater).toHaveProperty('modulation');
            expect(repeater).toHaveProperty('owner');
        });
    });
});

// Include the helper functions from the main script for testing
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
