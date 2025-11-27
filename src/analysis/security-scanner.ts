import { CodeFile, AnalysisResult, ReviewIssue } from '../types';

export class SecurityScanner {
  /**
   * Scan files for security vulnerabilities
   */
  async scanFiles(files: CodeFile[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    for (const file of files) {
      const issues = await this.scanFile(file);
      results.push({
        file: file.filename,
        language: file.language,
        issues,
        metrics: {
          linesOfCode: file.content.split('\n').length,
          cyclomaticComplexity: 0,
          cognitiveComplexity: 0,
          maintainabilityIndex: 0,
        },
      });
    }

    return results;
  }

  /**
   * Scan individual file for security issues
   */
  private async scanFile(file: CodeFile): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    const lines = file.content.split('\n');

    // Pattern-based security checks
    lines.forEach((line, index) => {
      // Check for hardcoded secrets
      this.checkHardcodedSecrets(line, index, file.filename, issues);

      // Check for SQL injection vulnerabilities
      this.checkSQLInjection(line, index, file.filename, issues);

      // Check for XSS vulnerabilities
      this.checkXSS(line, index, file.filename, issues);

      // Check for insecure crypto
      this.checkInsecureCrypto(line, index, file.filename, issues);

      // Check for path traversal
      this.checkPathTraversal(line, index, file.filename, issues);

      // Check for command injection
      this.checkCommandInjection(line, index, file.filename, issues);
    });

    return issues;
  }

  /**
   * Check for hardcoded secrets
   */
  private checkHardcodedSecrets(
    line: string,
    lineNum: number,
    filename: string,
    issues: ReviewIssue[]
  ) {
    // NOTE: These patterns may produce false positives for legitimate strings,
    // test data, or example values. They may also miss encoded/obfuscated secrets.
    // Consider implementing:
    // - Entropy analysis for random-looking strings
    // - Common API key prefix detection (sk-, pk-, etc.)
    // - Complementary secret scanning tools (e.g., TruffleHog, detect-secrets)
    const secretPatterns = [
      { pattern: /(?:api[_-]?key|apikey)[\s]*[:=][\s]*['"][a-zA-Z0-9]{20,}['"]/i, name: 'API Key' },
      { pattern: /(?:password|passwd|pwd)[\s]*[:=][\s]*['"][^'"]+['"]/i, name: 'Password' },
      {
        pattern: /(?:secret|token)[\s]*[:=][\s]*['"][a-zA-Z0-9]{20,}['"]/i,
        name: 'Secret/Token',
      },
      { pattern: /-----BEGIN (?:RSA |DSA )?PRIVATE KEY-----/, name: 'Private Key' },
      {
        pattern: /(?:aws_access_key_id|aws_secret_access_key)[\s]*[:=]/i,
        name: 'AWS Credentials',
      },
    ];

    for (const { pattern, name } of secretPatterns) {
      if (pattern.test(line)) {
        issues.push({
          severity: 'critical',
          category: 'security',
          message: `Possible hardcoded ${name} detected`,
          file: filename,
          line: lineNum + 1,
          suggestion: 'Use environment variables or a secrets management service instead',
          autoFixable: false,
        });
      }
    }
  }

  /**
   * Check for SQL injection vulnerabilities
   */
  private checkSQLInjection(
    line: string,
    lineNum: number,
    filename: string,
    issues: ReviewIssue[]
  ) {
    const sqlPatterns = [
      /execute\s*\(\s*["`'].*\$\{/i, // Template literal in SQL
      /execute\s*\(\s*["`'].*\+/i, // String concatenation in SQL
      /query\s*\(\s*["`'].*\$\{/i,
      /query\s*\(\s*["`'].*\+/i,
      /\.raw\s*\(\s*["`'].*\$\{/i,
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(line)) {
        issues.push({
          severity: 'critical',
          category: 'security',
          message: 'Potential SQL injection vulnerability - avoid string concatenation in queries',
          file: filename,
          line: lineNum + 1,
          suggestion: 'Use parameterized queries or prepared statements',
          autoFixable: false,
        });
      }
    }
  }

  /**
   * Check for XSS vulnerabilities
   */
  private checkXSS(line: string, lineNum: number, filename: string, issues: ReviewIssue[]) {
    const xssPatterns = [
      /dangerouslySetInnerHTML/i,
      /\.html\s*\(\s*[^)]*\$\{/i,
      /innerHTML\s*=\s*[^;]*\$\{/i,
      /document\.write\s*\(/i,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(line)) {
        issues.push({
          severity: 'high',
          category: 'security',
          message: 'Potential XSS vulnerability - unsafe HTML rendering',
          file: filename,
          line: lineNum + 1,
          suggestion: 'Sanitize user input before rendering or use safe APIs',
          autoFixable: false,
        });
      }
    }
  }

  /**
   * Check for insecure cryptography
   */
  private checkInsecureCrypto(
    line: string,
    lineNum: number,
    filename: string,
    issues: ReviewIssue[]
  ) {
    const cryptoPatterns = [
      { pattern: /\bmd5\b/i, algo: 'MD5' },
      { pattern: /\bsha1\b/i, algo: 'SHA1' },
      { pattern: /\bdes\b/i, algo: 'DES' },
      { pattern: /\brc4\b/i, algo: 'RC4' },
    ];

    for (const { pattern, algo } of cryptoPatterns) {
      if (pattern.test(line)) {
        issues.push({
          severity: 'high',
          category: 'security',
          message: `Insecure cryptographic algorithm: ${algo}`,
          file: filename,
          line: lineNum + 1,
          suggestion: 'Use modern algorithms like SHA-256, SHA-3, or bcrypt for passwords',
          autoFixable: false,
        });
      }
    }
  }

  /**
   * Check for path traversal vulnerabilities
   */
  private checkPathTraversal(
    line: string,
    lineNum: number,
    filename: string,
    issues: ReviewIssue[]
  ) {
    const pathPatterns = [
      /readFile\s*\(\s*[^)]*\$\{/i,
      /writeFile\s*\(\s*[^)]*\$\{/i,
      /open\s*\(\s*[^)]*\+/i,
    ];

    for (const pattern of pathPatterns) {
      if (pattern.test(line)) {
        issues.push({
          severity: 'high',
          category: 'security',
          message: 'Potential path traversal vulnerability',
          file: filename,
          line: lineNum + 1,
          suggestion: 'Validate and sanitize file paths, use path.join() and check path.resolve()',
          autoFixable: false,
        });
      }
    }
  }

  /**
   * Check for command injection
   */
  private checkCommandInjection(
    line: string,
    lineNum: number,
    filename: string,
    issues: ReviewIssue[]
  ) {
    const cmdPatterns = [
      /exec\s*\(\s*["`'].*\$\{/i,
      /spawn\s*\(\s*["`'].*\$\{/i,
      /system\s*\(\s*["`'].*\+/i,
    ];

    for (const pattern of cmdPatterns) {
      if (pattern.test(line)) {
        issues.push({
          severity: 'critical',
          category: 'security',
          message: 'Potential command injection vulnerability',
          file: filename,
          line: lineNum + 1,
          suggestion: 'Avoid executing shell commands with user input. Use safe APIs instead.',
          autoFixable: false,
        });
      }
    }
  }
}
