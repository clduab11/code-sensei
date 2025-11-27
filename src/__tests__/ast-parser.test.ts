import { ASTParser } from '../analysis/ast-parser';

describe('ASTParser', () => {
  let parser: ASTParser;

  beforeEach(() => {
    parser = new ASTParser();
  });

  describe('JavaScript Analysis', () => {
    it('should detect var usage', async () => {
      const code = `
        var x = 10;
        var y = 20;
      `;

      const result = await parser.analyzeCode('test.js', code);

      expect(result.issues).toHaveLength(2);
      expect(result.issues[0].code).toBe('no-var');
      expect(result.issues[0].severity).toBe('low');
    });

    it('should detect console.log statements', async () => {
      const code = `
        console.log('debug');
        console.info('info');
      `;

      const result = await parser.analyzeCode('test.js', code);

      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some((i) => i.code === 'no-console')).toBe(true);
    });

    it('should detect high complexity functions', async () => {
      const code = `
        function complex(x) {
          if (x > 0) {
            if (x > 10) {
              if (x > 20) {
                if (x > 30) {
                  return 1;
                }
              }
            }
          }
          return 0;
        }
      `;

      const result = await parser.analyzeCode('test.js', code);

      const complexityIssue = result.issues.find((i) =>
        i.message.includes('cyclomatic complexity')
      );
      expect(complexityIssue).toBeDefined();
    });

    it('should calculate code metrics', async () => {
      const code = `
        function add(a, b) {
          return a + b;
        }
      `;

      const result = await parser.analyzeCode('test.js', code);

      expect(result.metrics).toBeDefined();
      expect(result.metrics.linesOfCode).toBeGreaterThan(0);
      expect(result.metrics.cyclomaticComplexity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Python Analysis', () => {
    it('should detect wildcard imports', async () => {
      const code = `
from os import *
from sys import *
      `;

      const result = await parser.analyzeCode('test.py', code);

      const wildcardIssues = result.issues.filter((i) =>
        i.message.includes('wildcard imports')
      );
      expect(wildcardIssues.length).toBeGreaterThan(0);
    });

    it('should detect bare except clauses', async () => {
      const code = `
try:
    something()
except:
    pass
      `;

      const result = await parser.analyzeCode('test.py', code);

      const bareExceptIssue = result.issues.find((i) => i.message.includes('Bare except'));
      expect(bareExceptIssue).toBeDefined();
      expect(bareExceptIssue?.severity).toBe('high');
    });
  });
});
