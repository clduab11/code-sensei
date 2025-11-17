import { Context } from 'probot';
import { CodeAnalysisResult, AIReviewResult } from '../types';

export async function createReviewComment(
  context: Context,
  prNumber: number,
  path: string,
  line: number,
  body: string
): Promise<void> {
  try {
    const { repository } = context.payload;
    
    await context.octokit.pulls.createReviewComment({
      owner: repository.owner.login,
      repo: repository.name,
      pull_number: prNumber,
      body,
      path,
      line,
      side: 'RIGHT',
    });
  } catch (error) {
    console.error('Error creating review comment:', error);
  }
}

export async function updateCheckRun(
  context: Context,
  checkRunId: number,
  status: 'completed' | 'in_progress' | 'queued',
  analysisResults: CodeAnalysisResult[],
  aiReview: AIReviewResult
): Promise<void> {
  try {
    const { repository } = context.payload;
    
    const totalIssues = analysisResults.reduce((sum, r) => sum + r.issues.length, 0);
    const criticalIssues = analysisResults.reduce((sum, r) => 
      sum + r.issues.filter(i => i.severity === 'critical').length, 0
    );
    const securityIssues = analysisResults.reduce((sum, r) => sum + r.securityIssues.length, 0);

    let conclusion: 'success' | 'failure' | 'neutral' = 'success';
    if (criticalIssues > 0 || securityIssues > 0) {
      conclusion = 'failure';
    } else if (totalIssues > 10) {
      conclusion = 'neutral';
    }

    const summary = `## Code Sensei Review Summary\n\n` +
      `**Overall Score:** ${aiReview.overallScore}/100\n\n` +
      `**Issues Found:**\n` +
      `- Total: ${totalIssues}\n` +
      `- Critical: ${criticalIssues}\n` +
      `- Security: ${securityIssues}\n\n` +
      `**Code Smells:** ${aiReview.codeSmells.length}\n` +
      `**Refactoring Suggestions:** ${aiReview.refactoringSuggestions.length}`;

    const text = `${aiReview.summary}\n\n` +
      `For detailed review, see the PR comments.`;

    await context.octokit.checks.update({
      owner: repository.owner.login,
      repo: repository.name,
      check_run_id: checkRunId,
      status,
      conclusion: status === 'completed' ? conclusion : undefined,
      completed_at: status === 'completed' ? new Date().toISOString() : undefined,
      output: {
        title: 'Code Sensei Review',
        summary,
        text,
      },
    });
  } catch (error) {
    console.error('Error updating check run:', error);
  }
}

export function parseGitHubURL(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (match) {
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, ''),
    };
  }
  return null;
}

export async function getFileContent(
  context: Context,
  path: string,
  ref: string
): Promise<string> {
  try {
    const { repository } = context.payload;
    
    const { data } = await context.octokit.repos.getContent({
      owner: repository.owner.login,
      repo: repository.name,
      path,
      ref,
    });

    if ('content' in data) {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
  } catch (error) {
    console.error(`Error fetching file ${path}:`, error);
  }
  
  return '';
}
