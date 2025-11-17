import { SecurityScanner } from '../../services/analysis/scanners/securityScanner';

describe('SecurityScanner', () => {
  let scanner: SecurityScanner;

  beforeEach(() => {
    scanner = new SecurityScanner();
  });

  test('should detect SQL injection vulnerabilities', async () => {
    const code = `
      const query = "SELECT * FROM users WHERE id = " + userId;
      db.execute(query);
    `;

    const issues = await scanner.scan(code, 'javascript', 'test.js');
    const sqlInjection = issues.find(i => i.title.includes('SQL Injection'));
    expect(sqlInjection).toBeDefined();
    expect(sqlInjection?.severity).toBe('critical');
  });

  test('should detect XSS vulnerabilities', async () => {
    const code = `
      element.innerHTML = userInput;
    `;

    const issues = await scanner.scan(code, 'javascript', 'test.js');
    const xss = issues.find(i => i.title.includes('XSS'));
    expect(xss).toBeDefined();
    expect(xss?.severity).toBe('high');
  });

  test('should detect hardcoded secrets', async () => {
    const code = `
      const password = "mySecretPassword123";
      const api_key = "sk-1234567890";
    `;

    const issues = await scanner.scan(code, 'javascript', 'test.js');
    expect(issues.length).toBeGreaterThan(0);
    const secrets = issues.filter(i => i.cwe === 'CWE-798');
    expect(secrets.length).toBeGreaterThan(0);
  });

  test('should detect weak crypto algorithms', async () => {
    const code = `
      const hash = crypto.createHash('md5');
    `;

    const issues = await scanner.scan(code, 'javascript', 'test.js');
    const weakCrypto = issues.find(i => i.title.includes('Weak Cryptographic'));
    expect(weakCrypto).toBeDefined();
  });

  test('should not flag environment variables', async () => {
    const code = `
      const password = process.env.PASSWORD;
    `;

    const issues = await scanner.scan(code, 'javascript', 'test.js');
    const secrets = issues.filter(i => i.cwe === 'CWE-798');
    expect(secrets.length).toBe(0);
  });
});
