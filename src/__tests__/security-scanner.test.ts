import { SecurityScanner } from '../analysis/security-scanner';
import { CodeFile } from '../types';

describe('SecurityScanner', () => {
  let scanner: SecurityScanner;

  beforeEach(() => {
    scanner = new SecurityScanner();
  });

  it('should detect hardcoded API keys', async () => {
    const file: CodeFile = {
      filename: 'config.ts',
      content: `
        const apiKey = "fake_test_api_key_1234567890abcdefghijklmnop";
        const secret = "my_secret_token_12345";
      `,
      language: 'typescript',
      additions: 2,
      deletions: 0,
      changes: 2,
    };

    const results = await scanner.scanFiles([file]);

    expect(results[0].issues.length).toBeGreaterThan(0);
    expect(results[0].issues.some((i) => i.severity === 'critical')).toBe(true);
  });

  it('should detect SQL injection vulnerabilities', async () => {
    const file: CodeFile = {
      filename: 'db.ts',
      content: `
        const query = "SELECT * FROM users WHERE id = " + userId;
        execute(query);
      `,
      language: 'typescript',
      additions: 2,
      deletions: 0,
      changes: 2,
    };

    const results = await scanner.scanFiles([file]);

    const sqlInjection = results[0].issues.find((i) =>
      i.message.includes('SQL injection')
    );
    expect(sqlInjection).toBeDefined();
    expect(sqlInjection?.severity).toBe('critical');
  });

  it('should detect XSS vulnerabilities', async () => {
    const file: CodeFile = {
      filename: 'component.tsx',
      content: `
        <div dangerouslySetInnerHTML={{ __html: userInput }} />
      `,
      language: 'typescript',
      additions: 1,
      deletions: 0,
      changes: 1,
    };

    const results = await scanner.scanFiles([file]);

    const xssIssue = results[0].issues.find((i) => i.message.includes('XSS'));
    expect(xssIssue).toBeDefined();
    expect(xssIssue?.severity).toBe('high');
  });

  it('should detect insecure cryptography', async () => {
    const file: CodeFile = {
      filename: 'crypto.ts',
      content: `
        import md5 from 'md5';
        const hash = md5(password);
      `,
      language: 'typescript',
      additions: 2,
      deletions: 0,
      changes: 2,
    };

    const results = await scanner.scanFiles([file]);

    const cryptoIssue = results[0].issues.find((i) =>
      i.message.includes('cryptographic')
    );
    expect(cryptoIssue).toBeDefined();
  });
});
