import * as babelParser from '@babel/parser';
import traverse from '@babel/traverse';
import * as acorn from 'acorn';
import * as acornWalk from 'acorn-walk';
import { CodeMetrics, ReviewIssue } from '../types';
import { logger } from '../utils/logger';

export class ASTParser {
  /**
   * Parse and analyze code based on file extension
   */
  async analyzeCode(filename: string, content: string): Promise<{
    issues: ReviewIssue[];
    metrics: CodeMetrics;
  }> {
    const language = this.getLanguage(filename);

    try {
      switch (language) {
        case 'typescript':
        case 'javascript':
          return await this.analyzeJavaScript(content, filename, language);
        case 'python':
          return await this.analyzePython(content, filename);
        case 'go':
          return await this.analyzeGo(content, filename);
        case 'rust':
          return await this.analyzeRust(content, filename);
        default:
          return this.getDefaultAnalysis(content);
      }
    } catch (error) {
      logger.error('AST parsing error', {
        file: filename,
        error: error instanceof Error ? error.message : String(error),
      });
      return this.getDefaultAnalysis(content);
    }
  }

  private getLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      go: 'go',
      rs: 'rust',
    };
    return langMap[ext || ''] || 'unknown';
  }

  /**
   * Analyze JavaScript/TypeScript code
   */
  private async analyzeJavaScript(
    content: string,
    filename: string,
    language: string
  ): Promise<{ issues: ReviewIssue[]; metrics: CodeMetrics }> {
    const issues: ReviewIssue[] = [];
    let complexity = 0;
    let functionCount = 0;
    const functionComplexities: number[] = [];

    try {
      const ast = babelParser.parse(content, {
        sourceType: 'module',
        plugins: [
          'typescript',
          'jsx',
          'decorators-legacy',
          'classProperties',
          'objectRestSpread',
          'asyncGenerators',
          'dynamicImport',
          'optionalChaining',
          'nullishCoalescingOperator',
        ],
      });

      traverse(ast, {
        Function(path) {
          functionCount++;
          const funcComplexity = this.calculateFunctionComplexity(path);
          functionComplexities.push(funcComplexity);
          complexity += funcComplexity;

          // Check for overly complex functions
          if (funcComplexity > 10) {
            issues.push({
              severity: funcComplexity > 20 ? 'high' : 'medium',
              category: 'maintainability',
              message: `Function has cyclomatic complexity of ${funcComplexity}. Consider refactoring.`,
              file: filename,
              line: path.node.loc?.start.line,
              suggestion: 'Break down this function into smaller, more focused functions.',
              autoFixable: false,
            });
          }

          // Check for too many parameters
          const params = path.node.params.length;
          if (params > 5) {
            issues.push({
              severity: 'medium',
              category: 'maintainability',
              message: `Function has ${params} parameters. Consider using an options object.`,
              file: filename,
              line: path.node.loc?.start.line,
              suggestion: 'Refactor to use a configuration object instead of multiple parameters.',
              autoFixable: false,
            });
          }
        },

        ClassDeclaration(path) {
          const methods = path.node.body.body.filter(
            (member) => member.type === 'ClassMethod'
          );

          // Check for large classes
          if (methods.length > 15) {
            issues.push({
              severity: 'medium',
              category: 'maintainability',
              message: `Class has ${methods.length} methods. Consider splitting into smaller classes.`,
              file: filename,
              line: path.node.loc?.start.line,
              suggestion: 'Apply Single Responsibility Principle - extract related methods into separate classes.',
              autoFixable: false,
            });
          }
        },

        VariableDeclaration(path) {
          // Check for var usage
          if (path.node.kind === 'var') {
            issues.push({
              severity: 'low',
              category: 'best-practice',
              message: 'Use const or let instead of var',
              file: filename,
              line: path.node.loc?.start.line,
              suggestion: 'Replace var with const (if value doesn\'t change) or let',
              autoFixable: true,
              code: 'no-var',
            });
          }
        },

        CallExpression(path) {
          // Check for console.log in production
          if (
            path.node.callee.type === 'MemberExpression' &&
            path.node.callee.object.type === 'Identifier' &&
            path.node.callee.object.name === 'console'
          ) {
            issues.push({
              severity: 'low',
              category: 'best-practice',
              message: 'Remove console statements before production',
              file: filename,
              line: path.node.loc?.start.line,
              suggestion: 'Use a proper logging library instead of console',
              autoFixable: true,
              code: 'no-console',
            });
          }

          // Check for eval usage (security)
          if (
            path.node.callee.type === 'Identifier' &&
            path.node.callee.name === 'eval'
          ) {
            issues.push({
              severity: 'critical',
              category: 'security',
              message: 'Avoid using eval() - it poses security risks',
              file: filename,
              line: path.node.loc?.start.line,
              suggestion: 'Find alternative approaches that don\'t require dynamic code execution',
              autoFixable: false,
            });
          }
        },

        CatchClause(path) {
          // Check for empty catch blocks
          if (path.node.body.body.length === 0) {
            issues.push({
              severity: 'medium',
              category: 'bug',
              message: 'Empty catch block - errors are being silently ignored',
              file: filename,
              line: path.node.loc?.start.line,
              suggestion: 'At minimum, log the error. Better yet, handle it appropriately.',
              autoFixable: false,
            });
          }
        },
      });

      const linesOfCode = content.split('\n').length;
      const avgComplexity = functionComplexities.length > 0
        ? functionComplexities.reduce((a, b) => a + b, 0) / functionComplexities.length
        : 0;

      return {
        issues,
        metrics: {
          linesOfCode,
          cyclomaticComplexity: complexity,
          cognitiveComplexity: Math.round(avgComplexity * 1.5),
          maintainabilityIndex: this.calculateMaintainabilityIndex(
            linesOfCode,
            complexity,
            functionCount
          ),
        },
      };
    } catch (error) {
      logger.error('JavaScript AST parsing failed', { filename, error });
      return this.getDefaultAnalysis(content);
    }
  }

  /**
   * Calculate cyclomatic complexity for a function
   */
  private calculateFunctionComplexity(path: any): number {
    let complexity = 1;

    path.traverse({
      IfStatement() {
        complexity++;
      },
      ConditionalExpression() {
        complexity++;
      },
      ForStatement() {
        complexity++;
      },
      WhileStatement() {
        complexity++;
      },
      DoWhileStatement() {
        complexity++;
      },
      CaseStatement() {
        complexity++;
      },
      LogicalExpression(innerPath: any) {
        if (innerPath.node.operator === '&&' || innerPath.node.operator === '||') {
          complexity++;
        }
      },
      CatchClause() {
        complexity++;
      },
    });

    return complexity;
  }

  /**
   * Analyze Python code (simplified - would use tree-sitter in production)
   */
  private async analyzePython(
    content: string,
    filename: string
  ): Promise<{ issues: ReviewIssue[]; metrics: CodeMetrics }> {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');

    // Simple pattern-based analysis
    lines.forEach((line, index) => {
      // Check for wildcard imports
      if (line.match(/from\s+\S+\s+import\s+\*/)) {
        issues.push({
          severity: 'medium',
          category: 'best-practice',
          message: 'Avoid wildcard imports - they make code harder to understand',
          file: filename,
          line: index + 1,
          suggestion: 'Import specific items instead',
          autoFixable: false,
        });
      }

      // Check for bare except
      if (line.match(/except\s*:/)) {
        issues.push({
          severity: 'high',
          category: 'bug',
          message: 'Bare except clause catches all exceptions including system exits',
          file: filename,
          line: index + 1,
          suggestion: 'Catch specific exception types',
          autoFixable: false,
        });
      }

      // Check for mutable default arguments
      if (line.match(/def\s+\w+\([^)]*=\s*(\[|{)/)) {
        issues.push({
          severity: 'high',
          category: 'bug',
          message: 'Mutable default argument - can cause unexpected behavior',
          file: filename,
          line: index + 1,
          suggestion: 'Use None as default and initialize inside function',
          autoFixable: false,
        });
      }
    });

    return {
      issues,
      metrics: {
        linesOfCode: lines.length,
        cyclomaticComplexity: this.estimateComplexity(content),
        cognitiveComplexity: this.estimateComplexity(content),
        maintainabilityIndex: 65,
      },
    };
  }

  /**
   * Analyze Go code (simplified)
   */
  private async analyzeGo(
    content: string,
    filename: string
  ): Promise<{ issues: ReviewIssue[]; metrics: CodeMetrics }> {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for error handling
      if (line.includes('err :=') || line.includes('err =')) {
        const nextLine = lines[index + 1];
        if (!nextLine || !nextLine.includes('if err')) {
          issues.push({
            severity: 'high',
            category: 'bug',
            message: 'Error value not checked',
            file: filename,
            line: index + 1,
            suggestion: 'Always check error values immediately after assignment',
            autoFixable: false,
          });
        }
      }
    });

    return {
      issues,
      metrics: {
        linesOfCode: lines.length,
        cyclomaticComplexity: this.estimateComplexity(content),
        cognitiveComplexity: this.estimateComplexity(content),
        maintainabilityIndex: 70,
      },
    };
  }

  /**
   * Analyze Rust code (simplified)
   */
  private async analyzeRust(
    content: string,
    filename: string
  ): Promise<{ issues: ReviewIssue[]; metrics: CodeMetrics }> {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for unwrap() usage
      if (line.includes('.unwrap()')) {
        issues.push({
          severity: 'medium',
          category: 'bug',
          message: 'Using unwrap() can cause panics',
          file: filename,
          line: index + 1,
          suggestion: 'Use pattern matching or ? operator instead',
          autoFixable: false,
        });
      }

      // Check for unsafe blocks
      if (line.includes('unsafe')) {
        issues.push({
          severity: 'high',
          category: 'security',
          message: 'Unsafe block detected - ensure this is necessary and well-documented',
          file: filename,
          line: index + 1,
          suggestion: 'Document why unsafe is necessary and what invariants are being maintained',
          autoFixable: false,
        });
      }
    });

    return {
      issues,
      metrics: {
        linesOfCode: lines.length,
        cyclomaticComplexity: this.estimateComplexity(content),
        cognitiveComplexity: this.estimateComplexity(content),
        maintainabilityIndex: 75,
      },
    };
  }

  private estimateComplexity(content: string): number {
    const keywords = ['if', 'for', 'while', 'case', 'catch', '&&', '||'];
    let complexity = 1;

    keywords.forEach((keyword) => {
      const matches = content.match(new RegExp(keyword, 'g'));
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  private calculateMaintainabilityIndex(
    linesOfCode: number,
    complexity: number,
    functionCount: number
  ): number {
    // Simplified maintainability index calculation
    const halsteadVolume = linesOfCode * Math.log2(functionCount || 1);
    const mi = Math.max(
      0,
      (171 - 5.2 * Math.log(halsteadVolume) - 0.23 * complexity - 16.2 * Math.log(linesOfCode)) *
        100 /
        171
    );
    return Math.round(mi);
  }

  private getDefaultAnalysis(content: string): {
    issues: ReviewIssue[];
    metrics: CodeMetrics;
  } {
    const lines = content.split('\n').length;
    return {
      issues: [],
      metrics: {
        linesOfCode: lines,
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        maintainabilityIndex: 50,
      },
    };
  }
}
