import { SecurityIssue } from '../../../types';

export class SecurityScanner {
  async scan(content: string, language: string, filename: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // Check for common security vulnerabilities
    this.checkSQLInjection(content, issues, filename);
    this.checkXSS(content, issues, filename);
    this.checkHardcodedSecrets(content, issues, filename);
    this.checkInsecureCrypto(content, issues, filename);
    this.checkCommandInjection(content, issues, filename);
    this.checkPathTraversal(content, issues, filename);

    return issues;
  }

  private checkSQLInjection(content: string, issues: SecurityIssue[], filename: string) {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for string concatenation in SQL queries
      if (line.match(/(SELECT|INSERT|UPDATE|DELETE).*\+.*["']/i) ||
          line.match(/["'].*\+.*(SELECT|INSERT|UPDATE|DELETE)/i)) {
        issues.push({
          severity: 'critical',
          title: 'Potential SQL Injection',
          description: 'String concatenation detected in SQL query. Use parameterized queries.',
          file: filename,
          line: i + 1,
          cwe: 'CWE-89',
          recommendation: 'Use parameterized queries or prepared statements to prevent SQL injection.',
        });
      }
    }
  }

  private checkXSS(content: string, issues: SecurityIssue[], filename: string) {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for innerHTML usage
      if (line.includes('innerHTML') || line.includes('dangerouslySetInnerHTML')) {
        issues.push({
          severity: 'high',
          title: 'Potential XSS Vulnerability',
          description: 'Direct HTML injection detected. Ensure user input is properly sanitized.',
          file: filename,
          line: i + 1,
          cwe: 'CWE-79',
          recommendation: 'Sanitize user input and use safe DOM manipulation methods.',
        });
      }
    }
  }

  private checkHardcodedSecrets(content: string, issues: SecurityIssue[], filename: string) {
    const lines = content.split('\n');
    
    const secretPatterns = [
      { pattern: /password\s*=\s*["'][^"']+["']/i, name: 'password' },
      { pattern: /api[_-]?key\s*=\s*["'][^"']+["']/i, name: 'API key' },
      { pattern: /secret\s*=\s*["'][^"']+["']/i, name: 'secret' },
      { pattern: /token\s*=\s*["'][^"']+["']/i, name: 'token' },
      { pattern: /private[_-]?key\s*=\s*["'][^"']+["']/i, name: 'private key' },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const { pattern, name } of secretPatterns) {
        if (pattern.test(line) && !line.includes('process.env') && !line.includes('config.')) {
          issues.push({
            severity: 'critical',
            title: `Hardcoded ${name} detected`,
            description: `Found hardcoded ${name} in source code. Store secrets in environment variables.`,
            file: filename,
            line: i + 1,
            cwe: 'CWE-798',
            recommendation: 'Move secrets to environment variables or a secure secret management system.',
          });
        }
      }
    }
  }

  private checkInsecureCrypto(content: string, issues: SecurityIssue[], filename: string) {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for weak crypto algorithms
      if (line.match(/\b(MD5|SHA1)\b/i)) {
        issues.push({
          severity: 'high',
          title: 'Weak Cryptographic Algorithm',
          description: 'Use of weak cryptographic algorithm (MD5/SHA1) detected.',
          file: filename,
          line: i + 1,
          cwe: 'CWE-327',
          recommendation: 'Use strong cryptographic algorithms like SHA-256 or SHA-3.',
        });
      }
    }
  }

  private checkCommandInjection(content: string, issues: SecurityIssue[], filename: string) {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for command execution with user input
      if (line.match(/(exec|system|spawn|shell).*\+/)) {
        issues.push({
          severity: 'critical',
          title: 'Potential Command Injection',
          description: 'Command execution with string concatenation detected.',
          file: filename,
          line: i + 1,
          cwe: 'CWE-78',
          recommendation: 'Avoid executing commands with user input. If necessary, use parameterized APIs and validate input.',
        });
      }
    }
  }

  private checkPathTraversal(content: string, issues: SecurityIssue[], filename: string) {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for file operations with user input
      if (line.match(/(readFile|writeFile|open).*\+/) || line.match(/\.\.\//)) {
        issues.push({
          severity: 'high',
          title: 'Potential Path Traversal',
          description: 'File operation with potentially unsafe path detected.',
          file: filename,
          line: i + 1,
          cwe: 'CWE-22',
          recommendation: 'Validate and sanitize file paths. Use path.resolve() and check for directory traversal attempts.',
        });
      }
    }
  }
}
