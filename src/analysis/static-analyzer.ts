import { CodeFile, AnalysisResult, ReviewIssue } from '../types';
import { logger } from '../utils/logger';

export class StaticAnalyzer {
  /**
   * Run static analysis on files
   * In production, this would integrate with ESLint, Pylint, golangci-lint, etc.
   */
  async analyzeFiles(files: CodeFile[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    for (const file of files) {
      const issues = await this.analyzeFile(file);
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

  private async analyzeFile(file: CodeFile): Promise<ReviewIssue[]> {
    switch (file.language) {
      case 'javascript':
      case 'typescript':
        return this.analyzeJavaScript(file);
      case 'python':
        return this.analyzePython(file);
      default:
        return [];
    }
  }

  /**
   * JavaScript/TypeScript specific analysis
   */
  private analyzeJavaScript(file: CodeFile): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = file.content.split('\n');

    lines.forEach((line, index) => {
      // Check for TODO/FIXME comments
      if (/\/\/\s*(TODO|FIXME|HACK)/i.test(line)) {
        issues.push({
          severity: 'info',
          category: 'maintainability',
          message: 'TODO/FIXME comment found',
          file: file.filename,
          line: index + 1,
          suggestion: 'Address this technical debt item',
          autoFixable: false,
        });
      }

      // Check for console.log
      if (/console\.(log|debug|info)/.test(line) && !line.includes('//')) {
        issues.push({
          severity: 'low',
          category: 'best-practice',
          message: 'Console statement detected',
          file: file.filename,
          line: index + 1,
          suggestion: 'Remove console statements or use a logging library',
          autoFixable: true,
          code: 'no-console',
        });
      }

      // Check for debugger statements
      if (/\bdebugger\b/.test(line)) {
        issues.push({
          severity: 'medium',
          category: 'bug',
          message: 'Debugger statement should be removed',
          file: file.filename,
          line: index + 1,
          suggestion: 'Remove debugger statement before committing',
          autoFixable: true,
          code: 'no-debugger',
        });
      }

      // Check for any type
      if (/:\s*any\b/.test(line)) {
        issues.push({
          severity: 'low',
          category: 'best-practice',
          message: 'Using "any" type defeats TypeScript benefits',
          file: file.filename,
          line: index + 1,
          suggestion: 'Use a specific type instead of any',
          autoFixable: false,
          code: 'no-explicit-any',
        });
      }
    });

    return issues;
  }

  /**
   * Python specific analysis
   */
  private analyzePython(file: CodeFile): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = file.content.split('\n');

    lines.forEach((line, index) => {
      // Check for print statements
      if (/\bprint\s*\(/.test(line) && !line.trim().startsWith('#')) {
        issues.push({
          severity: 'low',
          category: 'best-practice',
          message: 'Print statement detected',
          file: file.filename,
          line: index + 1,
          suggestion: 'Use logging module instead of print',
          autoFixable: false,
        });
      }

      // Check for pass in except
      if (/except.*:\s*pass\s*$/.test(line)) {
        issues.push({
          severity: 'high',
          category: 'bug',
          message: 'Empty except block with pass',
          file: file.filename,
          line: index + 1,
          suggestion: 'Handle exceptions properly or at least log them',
          autoFixable: false,
        });
      }
    });

    return issues;
  }
}
