import { Issue } from '../../../types';

export class GoAnalyzer {
  async analyze(content: string, filename: string): Promise<Issue[]> {
    const issues: Issue[] = [];

    try {
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Check for error handling
        if (line.includes('err :=') && !lines.slice(i, i + 5).some(l => l.includes('if err'))) {
          issues.push({
            type: 'error',
            line: lineNumber,
            message: 'Error not checked, always handle errors in Go',
            rule: 'error-check',
            severity: 'high',
          });
        }

        // Check for naked returns
        if (line.match(/^\s*return\s*$/)) {
          issues.push({
            type: 'warning',
            line: lineNumber,
            message: 'Avoid naked returns for better readability',
            rule: 'no-naked-return',
            severity: 'low',
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

        // Check for panic usage
        if (line.includes('panic(')) {
          issues.push({
            type: 'warning',
            line: lineNumber,
            message: 'Avoid using panic(), return errors instead',
            rule: 'no-panic',
            severity: 'medium',
          });
        }

        // Check for goroutine without proper error handling
        if (line.includes('go func()') || line.includes('go ')) {
          issues.push({
            type: 'info',
            line: lineNumber,
            message: 'Ensure goroutine has proper error handling and synchronization',
            rule: 'goroutine-safety',
            severity: 'medium',
          });
        }
      }

    } catch (error) {
      console.error('Error analyzing Go file:', error);
    }

    return issues;
  }
}
