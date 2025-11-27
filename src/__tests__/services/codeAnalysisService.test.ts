import { CodeAnalysisService } from '../../services/analysis/codeAnalysisService';

describe('CodeAnalysisService', () => {
  let service: CodeAnalysisService;

  beforeEach(() => {
    service = new CodeAnalysisService();
  });

  test('should analyze Python files', async () => {
    const files = [{
      filename: 'test.py',
      patch: 'print("Hello")\nimport *',
    }];

    const results = await service.analyzeFiles(files);
    expect(results).toHaveLength(1);
    expect(results[0].language).toBe('python');
  });

  test('should analyze TypeScript files', async () => {
    const files = [{
      filename: 'test.ts',
      patch: 'const x: any = 5;\nconsole.log(x);',
    }];

    const results = await service.analyzeFiles(files);
    expect(results).toHaveLength(1);
    expect(results[0].language).toBe('typescript');
  });

  test('should detect language from extension', async () => {
    const files = [
      { filename: 'test.go', patch: '' },
      { filename: 'test.rs', patch: '' },
      { filename: 'test.js', patch: '' },
    ];

    const results = await service.analyzeFiles(files);
    expect(results).toHaveLength(3);
    expect(results[0].language).toBe('go');
    expect(results[1].language).toBe('rust');
    expect(results[2].language).toBe('javascript');
  });

  test('should skip unsupported file types', async () => {
    const files = [
      { filename: 'test.txt', patch: '' },
      { filename: 'README.md', patch: '' },
    ];

    const results = await service.analyzeFiles(files);
    expect(results).toHaveLength(0);
  });
});
