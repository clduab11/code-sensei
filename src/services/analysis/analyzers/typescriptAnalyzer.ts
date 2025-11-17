import { Issue } from '../../../types';
import { parse } from '@babel/parser';

export class TypeScriptAnalyzer {
  async analyze(content: string, filename: string): Promise<Issue[]> {
    const issues: Issue[] = [];

    try {
      // Parse TypeScript/JavaScript code
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
        errorRecovery: true,
      });

      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Check for console.log
        if (line.includes('console.log')) {
          issues.push({
            type: 'warning',
            line: lineNumber,
            message: 'Remove console.log statements in production code',
            rule: 'no-console',
            severity: 'low',
          });
        }

        // Check for any type
        if (line.match(/:\s*any\b/)) {
          issues.push({
            type: 'warning',
            line: lineNumber,
            message: 'Avoid using "any" type, use specific types instead',
            rule: 'no-any',
            severity: 'medium',
          });
        }

        // Check for == instead of ===
        if (line.match(/[^=!]==[^=]/) || line.match(/[^!]!=[^=]/)) {
          issues.push({
            type: 'error',
            line: lineNumber,
            message: 'Use === or !== instead of == or !=',
            rule: 'eqeqeq',
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

        // Check for var usage
        if (line.match(/\bvar\s+/)) {
          issues.push({
            type: 'warning',
            line: lineNumber,
            message: 'Use const or let instead of var',
            rule: 'no-var',
            severity: 'medium',
          });
        }

        // Check for empty catch blocks
        if (line.includes('catch') && lines[i + 1]?.trim() === '}') {
          issues.push({
            type: 'error',
            line: lineNumber,
            message: 'Empty catch block, handle errors properly',
            rule: 'no-empty-catch',
            severity: 'high',
          });
        }
      }

    } catch (error) {
      console.error('Error analyzing TypeScript file:', error);
      // If parsing fails, still check for basic patterns
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('console.log')) {
          issues.push({
            type: 'warning',
            line: i + 1,
            message: 'Remove console.log statements in production code',
            rule: 'no-console',
            severity: 'low',
          });
        }
      }
    }

    return issues;
  }
}
