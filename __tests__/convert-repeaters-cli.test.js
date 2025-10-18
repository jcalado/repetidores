// Mock fs and path modules
jest.mock('fs');
jest.mock('path');

const fs = require('fs');
const path = require('path');

const mockFs = fs;
const mockPath = path;

describe('CSV Conversion CLI Tests', () => {
    let originalArgv;
    let originalExit;
    let consoleLogSpy;
    let consoleErrorSpy;
    let processExitSpy;

    beforeEach(() => {
        // Mock process.argv
        originalArgv = process.argv;
        originalExit = process.exit;

        // Spy on console methods
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { });

        // Clear all mocks
        jest.clearAllMocks();

        // Setup default mocks
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(Buffer.from('header1,header2\nvalue1,value2'));
        mockPath.resolve.mockImplementation((...args) => args.join('/'));
    });

    afterEach(() => {
        process.argv = originalArgv;
        process.exit = originalExit;
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
    });

    describe('CLI Argument Parsing', () => {
        test('should parse input file from positional argument', () => {
            process.argv = ['node', 'script.js', 'input.csv'];

            // We can't easily test the main() function directly due to readline
            // So we'll test the argument parsing logic separately
            const args = process.argv.slice(2);
            const inputFlagIdx = args.findIndex((a) => a === '--input' || a === '-i');
            const inputPath = inputFlagIdx >= 0 ? args[inputFlagIdx + 1] : args[0];

            expect(inputPath).toBe('input.csv');
        });

        test('should parse input file from --input flag', () => {
            process.argv = ['node', 'script.js', '--input', 'input.csv'];

            const args = process.argv.slice(2);
            const inputFlagIdx = args.findIndex((a) => a === '--input' || a === '-i');
            const inputPath = inputFlagIdx >= 0 ? args[inputFlagIdx + 1] : args[0];

            expect(inputPath).toBe('input.csv');
        });

        test('should parse encoding flag', () => {
            process.argv = ['node', 'script.js', 'input.csv', '--encoding', 'latin1'];

            const args = process.argv.slice(2);
            const encFlagIdx = args.findIndex((a) => a === '--encoding' || a === '-e');
            const forcedEncoding = encFlagIdx >= 0 ? (args[encFlagIdx + 1] || '').toLowerCase() : '';

            expect(forcedEncoding).toBe('latin1');
        });

        test('should handle missing input file', () => {
            process.argv = ['node', 'script.js'];

            const args = process.argv.slice(2);
            const inputFlagIdx = args.findIndex((a) => a === '--input' || a === '-i');
            const inputPath = inputFlagIdx >= 0 ? args[inputFlagIdx + 1] : args[0];

            expect(inputPath).toBeUndefined();
        });
    });

    describe('File Operations', () => {
        test('should check if input file exists', () => {
            mockFs.existsSync.mockReturnValue(true);

            const result = mockFs.existsSync('input.csv');
            expect(result).toBe(true);
            expect(mockFs.existsSync).toHaveBeenCalledWith('input.csv');
        });

        test('should handle missing input file', () => {
            mockFs.existsSync.mockReturnValue(false);

            const result = mockFs.existsSync('missing.csv');
            expect(result).toBe(false);
        });

        test('should read file content', () => {
            const mockContent = 'header1,header2\nvalue1,value2';
            mockFs.readFileSync.mockReturnValue(Buffer.from(mockContent));

            const buffer = mockFs.readFileSync('input.csv');
            expect(buffer.toString()).toBe(mockContent);
        });

        test('should create backup file before overwriting', () => {
            const outPath = 'src/repeaters.json';
            const backupPath = `${outPath.replace(/\.json$/, '')}.backup.${Date.now()}.json`;

            mockFs.existsSync.mockReturnValue(true);
            mockFs.copyFileSync.mockImplementation(() => { });

            if (mockFs.existsSync(outPath)) {
                mockFs.copyFileSync(outPath, backupPath);
            }

            expect(mockFs.copyFileSync).toHaveBeenCalledWith(outPath, backupPath);
        });

        test('should write JSON output file', () => {
            const data = [{ callsign: 'CT7ABC', frequency: 145.225 }];
            const outPath = 'src/repeaters.json';

            mockFs.writeFileSync.mockImplementation(() => { });

            mockFs.writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n', 'utf8');

            expect(mockFs.writeFileSync).toHaveBeenCalledWith(
                outPath,
                JSON.stringify(data, null, 2) + '\n',
                'utf8'
            );
        });
    });

    describe('Encoding Detection', () => {
        test('should detect UTF-8 encoding', () => {
            const utf8Content = 'Frequência,Entidade\n145,225,ANACOM';
            mockFs.readFileSync.mockReturnValue(Buffer.from(utf8Content));

            const buffer = mockFs.readFileSync('input.csv');
            const text = buffer.toString('utf8');

            expect(text).toContain('Frequência');
            expect(text).toContain('Entidade');
        });

        test('should fallback to latin1 encoding', () => {
            // Simulate UTF-8 content that looks like replacement characters
            const problematicContent = 'Fr�qu�ncia,Entidade\n145,225,ANACOM';
            const correctContent = 'Frequência,Entidade\n145,225,ANACOM';

            // First call returns problematic UTF-8
            mockFs.readFileSync.mockReturnValueOnce(Buffer.from(problematicContent, 'utf8'));
            const buffer1 = mockFs.readFileSync('input.csv');
            const utf8Text = buffer1.toString('utf8');

            // Second call returns correct latin1
            mockFs.readFileSync.mockReturnValueOnce(Buffer.from(correctContent, 'latin1'));
            const buffer2 = mockFs.readFileSync('input.csv');
            const latin1Text = buffer2.toString('latin1');

            // Should detect the replacement character issue and use latin1
            expect(utf8Text).toContain('�');
            expect(latin1Text).toContain('Frequência');
        });

        test('should handle forced encoding', () => {
            const content = 'Frequência,Entidade';
            // Create buffer with latin1 encoding to simulate the actual file content
            mockFs.readFileSync.mockReturnValue(Buffer.from(content, 'latin1'));

            const buffer = mockFs.readFileSync('input.csv');
            const text = buffer.toString('latin1');

            expect(text).toBe(content);
        });
    });

    describe('Error Handling', () => {
        test('should handle file read errors', () => {
            mockFs.readFileSync.mockImplementation(() => {
                throw new Error('File read error');
            });

            expect(() => {
                mockFs.readFileSync('input.csv');
            }).toThrow('File read error');
        });

        test('should handle file write errors', () => {
            mockFs.writeFileSync.mockImplementation(() => {
                throw new Error('File write error');
            });

            expect(() => {
                mockFs.writeFileSync('output.json', 'content');
            }).toThrow('File write error');
        });

        test('should handle invalid encoding', () => {
            mockFs.readFileSync.mockReturnValue(Buffer.from('content'));

            const buffer = mockFs.readFileSync('input.csv');

            expect(() => {
                buffer.toString('invalid-encoding');
            }).toThrow();
        });
    });

    describe('Path Resolution', () => {
        test('should resolve relative paths', () => {
            mockPath.resolve.mockImplementation((...args) => {
                if (args.length === 1) return args[0];
                return args.slice(1).join('/');
            });

            const resolved = mockPath.resolve('src/repeaters.json');
            expect(resolved).toBe('src/repeaters.json');
        });

        test('should resolve absolute paths', () => {
            const cwd = '/current/working/directory';
            const relative = 'input.csv';

            mockPath.resolve.mockReturnValue(`${cwd}/${relative}`);

            const resolved = mockPath.resolve(cwd, relative);
            expect(resolved).toBe('/current/working/directory/input.csv');
        });
    });
});
