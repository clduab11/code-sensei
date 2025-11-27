import { Issue } from '../../../types';

export class RustAnalyzer {
  async analyze(content: string, _filename: string): Promise<Issue[]> {
    const issues: Issue[] = [];

    try {
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Check for unwrap usage
        if (line.includes('.unwrap()')) {
          issues.push({
            type: 'warning',
            line: lineNumber,
            message: 'Avoid using unwrap(), use proper error handling with match or ?',
            rule: 'no-unwrap',
            severity: 'high',
          });
        }

        // Check for expect usage
        if (line.includes('.expect(')) {
          issues.push({
            type: 'info',
            line: lineNumber,
            message: 'Consider using proper error handling instead of expect()',
            rule: 'prefer-error-handling',
            severity: 'medium',
          });
        }

        // Check for TODO comments
        if (line.includes('TODO') || line.includes('FIXME')) {
          issues.push({
            type: 'info',
            line: lineNumber,
            message: 'Found TODO/FIXME comment',
            rule: 'todo-comment',
            severity: 'low',
          });
        }

        // Check for unsafe blocks
        if (line.includes('unsafe')) {
          issues.push({
            type: 'warning',
            line: lineNumber,
            message: 'Unsafe block detected, ensure it\'s necessary and well-documented',
            rule: 'unsafe-usage',
            severity: 'high',
          });
        }

        // Check for println! in production code
        if (line.includes('println!')) {
          issues.push({
            type: 'info',
            line: lineNumber,
            message: 'Consider using proper logging instead of println!',
            rule: 'prefer-logging',
            severity: 'low',
          });
        }

        // Check for clone() usage
        if (line.includes('.clone()')) {
          issues.push({
            type: 'info',
            line: lineNumber,
            message: 'Unnecessary clone() may impact performance, consider borrowing',
            rule: 'unnecessary-clone',
            severity: 'low',
          });
        }
      }

    } catch (error) {
      console.error('Error analyzing Rust file:', error);
    }

    return issues;
  }
}
