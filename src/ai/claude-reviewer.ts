import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { logger } from '../utils/logger';
import { CodeFile, AIReviewResult, ReviewIssue } from '../types';

export class ClaudeReviewer {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.ai.apiKey,
    });
  }

  /**
   * Perform AI-powered code review using Claude Opus
   */
  async reviewCode(files: CodeFile[], context: {
    prTitle: string;
    prDescription: string;
    baseBranch: string;
  }): Promise<AIReviewResult> {
    try {
      logger.info('Starting Claude AI review', {
        fileCount: files.length,
        totalLines: files.reduce((sum, f) => sum + f.content.split('\n').length, 0),
      });

      const prompt = this.buildReviewPrompt(files, context);

      const message = await this.client.messages.create({
        model: config.ai.model,
        max_tokens: config.ai.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text'
        ? message.content[0].text
        : '';

      return this.parseReviewResponse(responseText, files);
    } catch (error) {
      logger.error('Claude AI review failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Build comprehensive review prompt for Claude
   */
  private buildReviewPrompt(files: CodeFile[], context: {
    prTitle: string;
    prDescription: string;
    baseBranch: string;
  }): string {
    const filesContent = files
      .map(
        (file) => `
### File: ${file.filename}
Language: ${file.language}
Changes: +${file.additions} -${file.deletions}

\`\`\`${file.language}
${file.content}
\`\`\`

${file.patch ? `Diff:\n\`\`\`diff\n${file.patch}\n\`\`\`` : ''}
`
      )
      .join('\n---\n');

    return `You are Code Sensei, an expert code reviewer with deep knowledge of software engineering best practices, security, and architecture patterns.

# Pull Request Context
**Title:** ${context.prTitle}
**Description:** ${context.prDescription || 'No description provided'}
**Base Branch:** ${context.baseBranch}

# Files to Review
${filesContent}

# Review Instructions

Please provide a comprehensive code review covering:

## 1. Architecture & Design Patterns
- Evaluate the overall architecture and design decisions
- Identify design patterns used (or that should be used)
- Assess adherence to SOLID principles
- Check for proper separation of concerns

## 2. Code Quality & Best Practices
- Identify code smells and anti-patterns
- Check naming conventions (variables, functions, classes)
- Evaluate code readability and maintainability
- Assess error handling and edge cases
- Check for proper use of language features

## 3. Security Analysis
- Identify potential security vulnerabilities
- Check for common OWASP Top 10 issues:
  * SQL Injection
  * XSS (Cross-Site Scripting)
  * Authentication/Authorization flaws
  * Sensitive data exposure
  * XML External Entities (XXE)
  * Security misconfiguration
  * Insecure deserialization
- Evaluate input validation and sanitization
- Check for hardcoded secrets or credentials

## 4. Performance Considerations
- Identify potential performance bottlenecks
- Check for inefficient algorithms or data structures
- Evaluate database query efficiency
- Assess memory usage patterns
- Look for N+1 query problems

## 5. Testing & Testability
- Evaluate testability of the code
- Identify areas lacking test coverage
- Suggest test cases that should be added
- Check for proper mocking and dependency injection

## 6. Documentation
- Assess code documentation quality
- Check for missing JSDoc/docstrings
- Evaluate README and inline comments
- Identify areas needing better explanation

## 7. Accessibility (if UI code)
- Check ARIA labels and semantic HTML
- Evaluate keyboard navigation
- Assess screen reader compatibility

# Output Format

Provide your review in the following JSON format:

{
  "summary": "Brief 2-3 sentence summary of the overall code quality and main findings",
  "overallScore": 85,
  "securityScore": 90,
  "maintainabilityScore": 80,
  "complexityScore": 75,
  "positiveFindings": [
    "Excellent use of TypeScript for type safety",
    "Well-structured error handling throughout"
  ],
  "issues": [
    {
      "severity": "critical|high|medium|low|info",
      "category": "security|performance|maintainability|style|bug|best-practice",
      "message": "Clear description of the issue",
      "file": "path/to/file.ts",
      "line": 42,
      "suggestion": "Specific suggestion for how to fix",
      "autoFixable": true|false,
      "code": "rule-identifier-if-applicable"
    }
  ],
  "recommendations": [
    "Consider adding integration tests for the API endpoints",
    "Extract the validation logic into a separate module"
  ]
}

Focus on actionable feedback. Be thorough but constructive. Highlight both what's done well and what needs improvement.`;
  }

  /**
   * Parse Claude's response into structured review result
   */
  private parseReviewResponse(response: string, files: CodeFile[]): AIReviewResult {
    try {
      // Extract JSON from response (Claude might wrap it in markdown)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize the response
      return {
        summary: parsed.summary || 'Code review completed',
        overallScore: this.normalizeScore(parsed.overallScore),
        securityScore: this.normalizeScore(parsed.securityScore),
        maintainabilityScore: this.normalizeScore(parsed.maintainabilityScore),
        complexityScore: this.normalizeScore(parsed.complexityScore),
        positiveFindings: Array.isArray(parsed.positiveFindings)
          ? parsed.positiveFindings
          : [],
        issues: this.validateIssues(parsed.issues || []),
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [],
      };
    } catch (error) {
      logger.error('Failed to parse Claude response', { error });

      // Return a fallback response
      return {
        summary: 'Review completed with parsing issues. Please check manually.',
        overallScore: 50,
        positiveFindings: [],
        issues: [],
        recommendations: ['Manual review recommended due to parsing error'],
      };
    }
  }

  /**
   * Validate and normalize issues from Claude's response
   */
  private validateIssues(issues: any[]): ReviewIssue[] {
    return issues
      .filter((issue) => issue && typeof issue === 'object')
      .map((issue) => ({
        severity: this.normalizeSeverity(issue.severity),
        category: this.normalizeCategory(issue.category),
        message: issue.message || 'Issue detected',
        file: issue.file || 'unknown',
        line: typeof issue.line === 'number' ? issue.line : undefined,
        endLine: typeof issue.endLine === 'number' ? issue.endLine : undefined,
        column: typeof issue.column === 'number' ? issue.column : undefined,
        suggestion: issue.suggestion || '',
        autoFixable: issue.autoFixable === true,
        code: issue.code,
      }));
  }

  private normalizeSeverity(
    severity: string
  ): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const normalized = severity?.toLowerCase();
    if (['critical', 'high', 'medium', 'low', 'info'].includes(normalized)) {
      return normalized as 'critical' | 'high' | 'medium' | 'low' | 'info';
    }
    return 'medium';
  }

  private normalizeCategory(
    category: string
  ): 'security' | 'performance' | 'maintainability' | 'style' | 'bug' | 'best-practice' {
    const normalized = category?.toLowerCase();
    if (
      ['security', 'performance', 'maintainability', 'style', 'bug', 'best-practice'].includes(
        normalized
      )
    ) {
      return normalized as
        | 'security'
        | 'performance'
        | 'maintainability'
        | 'style'
        | 'bug'
        | 'best-practice';
    }
    return 'maintainability';
  }

  private normalizeScore(score: any): number {
    const num = typeof score === 'number' ? score : parseInt(score, 10);
    if (isNaN(num)) return 50;
    return Math.max(0, Math.min(100, num));
  }

  /**
   * Explain specific code section
   */
  async explainCode(code: string, language: string, context: string): Promise<string> {
    try {
      const message = await this.client.messages.create({
        model: config.ai.model,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `As Code Sensei, please explain the following ${language} code:

Context: ${context}

\`\`\`${language}
${code}
\`\`\`

Provide a clear explanation of:
1. What the code does
2. How it works
3. Any potential issues or improvements
4. Best practices being followed or violated

Keep the explanation concise and educational.`,
          },
        ],
      });

      return message.content[0].type === 'text' ? message.content[0].text : '';
    } catch (error) {
      logger.error('Code explanation failed', { error });
      return 'Failed to generate explanation. Please try again.';
    }
  }

  /**
   * Generate suggested refactoring
   */
  async suggestRefactoring(code: string, language: string, issue: string): Promise<string> {
    try {
      const message = await this.client.messages.create({
        model: config.ai.model,
        max_tokens: 3072,
        messages: [
          {
            role: 'user',
            content: `As Code Sensei, suggest a refactoring for this ${language} code to address: ${issue}

\`\`\`${language}
${code}
\`\`\`

Provide:
1. The refactored code
2. Explanation of changes
3. Benefits of the refactoring

Format the refactored code in a code block.`,
          },
        ],
      });

      return message.content[0].type === 'text' ? message.content[0].text : '';
    } catch (error) {
      logger.error('Refactoring suggestion failed', { error });
      return 'Failed to generate refactoring suggestion. Please try again.';
    }
  }
}
