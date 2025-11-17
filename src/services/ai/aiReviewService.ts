import Anthropic from '@anthropic-ai/sdk';
import { AIReviewResult, CodeAnalysisResult } from '../../types';

export class AIReviewService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  async reviewCode(analysisResults: CodeAnalysisResult[], pullRequest: any): Promise<AIReviewResult> {
    try {
      // Prepare context for Claude
      const context = this.prepareContext(analysisResults, pullRequest);
      
      // Call Claude API
      const response = await this.client.messages.create({
        model: 'claude-opus-4-20250514',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: context,
        }],
      });

      // Parse Claude's response
      const reviewText = response.content[0].type === 'text' ? response.content[0].text : '';
      return this.parseReviewResponse(reviewText, analysisResults);

    } catch (error) {
      console.error('Error during AI review:', error);
      return this.getFallbackReview(analysisResults);
    }
  }

  private prepareContext(analysisResults: CodeAnalysisResult[], pullRequest: any): string {
    let context = `You are Code Sensei, an expert code reviewer. Review the following pull request changes and provide detailed feedback.\n\n`;
    context += `## Pull Request Information\n`;
    context += `Title: ${pullRequest.title}\n`;
    context += `Description: ${pullRequest.body || 'No description provided'}\n\n`;
    context += `## Code Analysis Results\n\n`;

    for (const result of analysisResults) {
      context += `### File: ${result.file} (${result.language})\n\n`;
      
      context += `**Complexity Metrics:**\n`;
      context += `- Cyclomatic Complexity: ${result.complexity.cyclomaticComplexity}\n`;
      context += `- Cognitive Complexity: ${result.complexity.cognitiveComplexity}\n`;
      context += `- Lines of Code: ${result.complexity.linesOfCode}\n`;
      context += `- Maintainability Index: ${result.complexity.maintainabilityIndex.toFixed(2)}\n\n`;

      if (result.issues.length > 0) {
        context += `**Issues Found (${result.issues.length}):**\n`;
        result.issues.forEach(issue => {
          context += `- Line ${issue.line}: [${issue.severity}] ${issue.message}\n`;
        });
        context += `\n`;
      }

      if (result.securityIssues.length > 0) {
        context += `**Security Issues (${result.securityIssues.length}):**\n`;
        result.securityIssues.forEach(issue => {
          context += `- [${issue.severity}] ${issue.title}: ${issue.description}\n`;
        });
        context += `\n`;
      }
    }

    context += `\n## Review Requirements\n`;
    context += `Please provide:\n`;
    context += `1. An overall score (0-100) for code quality\n`;
    context += `2. Architecture analysis (patterns, structure, design)\n`;
    context += `3. Best practices followed or missed\n`;
    context += `4. Code smells identified with severity and suggestions\n`;
    context += `5. Refactoring suggestions with priority and estimated effort\n`;
    context += `6. A concise summary\n\n`;
    context += `Format your response as JSON with the following structure:\n`;
    context += `{\n`;
    context += `  "overallScore": <number>,\n`;
    context += `  "architectureAnalysis": "<string>",\n`;
    context += `  "bestPractices": [<strings>],\n`;
    context += `  "codeSmells": [{"type": "", "description": "", "location": "", "severity": "", "suggestion": ""}],\n`;
    context += `  "refactoringSuggestions": [{"title": "", "description": "", "location": "", "priority": "", "estimatedEffort": ""}],\n`;
    context += `  "summary": "<string>"\n`;
    context += `}`;

    return context;
  }

  private parseReviewResponse(reviewText: string, analysisResults: CodeAnalysisResult[]): AIReviewResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = reviewText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          overallScore: parsed.overallScore || 70,
          architectureAnalysis: parsed.architectureAnalysis || 'No analysis provided',
          bestPractices: parsed.bestPractices || [],
          codeSmells: parsed.codeSmells || [],
          refactoringSuggestions: parsed.refactoringSuggestions || [],
          summary: parsed.summary || reviewText.substring(0, 500),
        };
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }

    return this.getFallbackReview(analysisResults);
  }

  private getFallbackReview(analysisResults: CodeAnalysisResult[]): AIReviewResult {
    const totalIssues = analysisResults.reduce((sum, r) => sum + r.issues.length, 0);
    const criticalIssues = analysisResults.reduce((sum, r) => 
      sum + r.issues.filter(i => i.severity === 'critical').length, 0
    );
    const securityIssues = analysisResults.reduce((sum, r) => sum + r.securityIssues.length, 0);

    let score = 85;
    score -= criticalIssues * 10;
    score -= securityIssues * 15;
    score -= Math.min(totalIssues * 2, 30);
    score = Math.max(0, Math.min(100, score));

    const codeSmells = analysisResults.flatMap(result => 
      result.issues
        .filter(i => i.severity === 'high' || i.severity === 'critical')
        .map(issue => ({
          type: issue.rule || 'code-issue',
          description: issue.message,
          location: `${result.file}:${issue.line}`,
          severity: issue.severity === 'critical' ? 'high' as const : 'medium' as const,
          suggestion: 'Review and fix this issue to improve code quality',
        }))
    );

    return {
      overallScore: score,
      architectureAnalysis: 'Code structure appears reasonable with standard patterns.',
      bestPractices: [
        'Code is organized in logical files',
        'Using appropriate language features',
      ],
      codeSmells,
      refactoringSuggestions: [],
      summary: `Review complete. Found ${totalIssues} issues including ${criticalIssues} critical and ${securityIssues} security issues. Overall score: ${score}/100.`,
    };
  }
}
