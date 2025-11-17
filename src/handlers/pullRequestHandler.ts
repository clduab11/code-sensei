import { Probot, Context } from 'probot';
import { CodeAnalysisService } from '../services/analysis/codeAnalysisService';
import { AIReviewService } from '../services/ai/aiReviewService';
import { AutoFixService } from '../services/autofix/autoFixService';
import { createReviewComment, updateCheckRun } from '../utils/githubUtils';

export function setupPRHandlers(app: Probot) {
  // Handle PR opened, synchronize, and reopened events
  app.on(['pull_request.opened', 'pull_request.synchronize', 'pull_request.reopened'], async (context: Context<'pull_request.opened'>) => {
    const { pull_request, repository } = context.payload;
    
    app.log.info(`Processing PR #${pull_request.number} in ${repository.full_name}`);

    try {
      // Create initial check run
      const checkRun = await context.octokit.checks.create({
        owner: repository.owner.login,
        repo: repository.name,
        name: 'Code Sensei Review',
        head_sha: pull_request.head.sha,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      });

      // Get PR files
      const files = await context.octokit.pulls.listFiles({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pull_request.number,
      });

      // Initialize services
      const analysisService = new CodeAnalysisService();
      const aiReviewService = new AIReviewService();
      const autoFixService = new AutoFixService(context.octokit, repository.owner.login, repository.name);

      // Analyze code
      const analysisResults = await analysisService.analyzeFiles(files.data);
      
      // Perform AI review
      const aiReview = await aiReviewService.reviewCode(analysisResults, pull_request);

      // Post review comments
      for (const result of analysisResults) {
        for (const issue of result.issues) {
          await createReviewComment(
            context,
            pull_request.number,
            result.file,
            issue.line,
            issue.message
          );
        }
      }

      // Post AI review summary as a comment
      const summaryComment = formatAIReviewSummary(aiReview);
      await context.octokit.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: pull_request.number,
        body: summaryComment,
      });

      // Attempt auto-fix if configured
      const autoFixEnabled = process.env.AUTO_FIX_ENABLED === 'true';
      if (autoFixEnabled && aiReview.refactoringSuggestions.length > 0) {
        const autoFixResult = await autoFixService.applyFixes(
          pull_request.number,
          pull_request.head.ref,
          aiReview.refactoringSuggestions
        );
        
        if (autoFixResult.fixed) {
          await context.octokit.issues.createComment({
            owner: repository.owner.login,
            repo: repository.name,
            issue_number: pull_request.number,
            body: `🤖 Auto-fix applied: ${autoFixResult.filesModified.length} file(s) modified. Commit: ${autoFixResult.commit?.sha}`,
          });
        }
      }

      // Update check run with results
      await updateCheckRun(
        context,
        checkRun.data.id,
        'completed',
        analysisResults,
        aiReview
      );

    } catch (error) {
      app.log.error('Error processing PR:', error);
      await context.octokit.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: pull_request.number,
        body: '❌ Code Sensei encountered an error during review. Please check the logs.',
      });
    }
  });
}

function formatAIReviewSummary(aiReview: any): string {
  let summary = `## 🎓 Code Sensei AI Review\n\n`;
  summary += `**Overall Score:** ${aiReview.overallScore}/100\n\n`;
  summary += `### Architecture Analysis\n${aiReview.architectureAnalysis}\n\n`;
  
  if (aiReview.bestPractices.length > 0) {
    summary += `### ✅ Best Practices\n`;
    aiReview.bestPractices.forEach((practice: string) => {
      summary += `- ${practice}\n`;
    });
    summary += `\n`;
  }

  if (aiReview.codeSmells.length > 0) {
    summary += `### ⚠️ Code Smells Detected\n`;
    aiReview.codeSmells.forEach((smell: any) => {
      summary += `- **${smell.type}** (${smell.severity}): ${smell.description}\n`;
      summary += `  - Location: ${smell.location}\n`;
      summary += `  - Suggestion: ${smell.suggestion}\n\n`;
    });
  }

  if (aiReview.refactoringSuggestions.length > 0) {
    summary += `### 🔧 Refactoring Suggestions\n`;
    aiReview.refactoringSuggestions.forEach((suggestion: any) => {
      summary += `- **${suggestion.title}** (${suggestion.priority} priority)\n`;
      summary += `  - ${suggestion.description}\n`;
      summary += `  - Location: ${suggestion.location}\n\n`;
    });
  }

  summary += `\n${aiReview.summary}`;
  
  return summary;
}
