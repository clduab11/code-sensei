import { Issue } from '../../../types';

export class PythonAnalyzer {
  async analyze(content: string, filename: string): Promise<Issue[]> {
    const issues: Issue[] = [];

    try {
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Check for common Python issues
        if (line.includes('eval(') || line.includes('exec(')) {
          issues.push({
            type: 'error',
            line: lineNumber,
            message: 'Avoid using eval() or exec() as they pose security risks',
            rule: 'no-eval',
            severity: 'critical',
          });
        }

        if (line.match(/except:\s*$/)) {
          issues.push({
            type: 'warning',
            line: lineNumber,
            message: 'Bare except clause catches all exceptions, be more specific',
            rule: 'bare-except',
            severity: 'medium',
          });
        }

        if (line.includes('import *')) {
          issues.push({
            type: 'warning',
            line: lineNumber,
            message: 'Avoid wildcard imports, be explicit about what you import',
            rule: 'no-wildcard-import',
            severity: 'low',
          });
        }

        if (line.includes('TODO') || line.includes('FIXME')) {
          issues.push({
            type: 'info',
            line: lineNumber,
            message: 'Found TODO/FIXME comment',
            rule: 'todo-comment',
            severity: 'low',
          });
        }

        if (line.match(/^\s*print\(/)) {
          issues.push({
            type: 'info',
            line: lineNumber,
            message: 'Consider using logging instead of print statements',
            rule: 'prefer-logging',
            severity: 'low',
          });
        }
      }

    } catch (error) {
      console.error('Error analyzing Python file:', error);
    }

    return issues;
  }
}
