import { Probot, Context } from 'probot';
import { logger } from '../utils/logger';
import { ReviewService } from '../services/review-service';
import { NotificationService } from '../services/notification-service';
import { AnalyticsService } from '../services/analytics-service';
import { AIReviewResult } from '../types';

export function setupWebhooks(app: Probot) {
  const reviewService = new ReviewService();
  const notificationService = new NotificationService();
  const analyticsService = new AnalyticsService();

  // Pull Request opened or synchronized
  app.on(['pull_request.opened', 'pull_request.synchronize'], async (context) => {
    await handlePullRequestReview(context, reviewService, notificationService, analyticsService);
  });

  // Pull Request review requested
  app.on('pull_request.review_requested', async (context) => {
    logger.info('Review requested for PR', {
      repo: context.payload.repository.full_name,
      pr: context.payload.pull_request?.number,
    });
    await handlePullRequestReview(context, reviewService, notificationService, analyticsService);
  });

  // Issue comment commands
  app.on('issue_comment.created', async (context) => {
    await handleIssueComment(context, reviewService);
  });

  // Check run requests
  app.on('check_run.rerequested', async (context) => {
    logger.info('Check run rerequested', {
      repo: context.payload.repository.full_name,
    });
  });

  // Installation events
  app.on('installation.created', async (context) => {
    await handleInstallation(context);
  });

  app.on('installation.deleted', async (context) => {
    logger.info('App uninstalled', {
      account: context.payload.installation.account.login,
    });
  });

  // Repository added/removed from installation
  app.on('installation_repositories.added', async (context) => {
    logger.info('Repositories added to installation', {
      repos: context.payload.repositories_added.map((r: any) => r.full_name),
    });
  });

  logger.info('Webhooks configured successfully');
}

async function handlePullRequestReview(
  context: Context<'pull_request.opened'> | Context<'pull_request.synchronize'>,
  reviewService: ReviewService,
  notificationService: NotificationService,
  analyticsService: AnalyticsService
) {
  const { pull_request, repository } = context.payload;
  const startTime = Date.now();

  logger.info('Starting PR review', {
    repo: repository.full_name,
    pr: pull_request.number,
    author: pull_request.user.login,
  });

  try {
    // Create pending status check
    await context.octokit.repos.createCommitStatus({
      owner: repository.owner.login,
      repo: repository.name,
      sha: pull_request.head.sha,
      state: 'pending',
      context: 'code-sensei/review',
      description: 'Code Sensei is reviewing your code...',
    });

    // Perform the review
    const reviewResult = await reviewService.reviewPullRequest({
      owner: repository.owner.login,
      repo: repository.name,
      pullNumber: pull_request.number,
      sha: pull_request.head.sha,
      ref: pull_request.head.ref,
      baseBranch: pull_request.base.ref,
      author: pull_request.user.login,
    }, context.octokit);

    // Post review comment
    const commentBody = formatReviewComment(reviewResult);
    await context.octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: pull_request.number,
      body: commentBody,
    });

    // Create inline comments for issues
    if (reviewResult.issues.length > 0) {
      const comments = reviewResult.issues
        .filter(issue => issue.line)
        .map(issue => ({
          path: issue.file,
          line: issue.line!,
          side: 'RIGHT' as const, // 'RIGHT' = PR branch (new code), 'LEFT' = base branch (old code)
          body: `**${issue.severity.toUpperCase()}**: ${issue.message}\n\n${issue.suggestion || ''}`,
        }))
        .slice(0, 30); // GitHub API limit is 30, not 50

      if (comments.length > 0) {
        await context.octokit.pulls.createReview({
          owner: repository.owner.login,
          repo: repository.name,
          pull_number: pull_request.number,
          event: 'COMMENT',
          comments,
        });
      }
    }

    // Update status check
    const state = reviewResult.overallScore >= 80 ? 'success' : 'failure';
    await context.octokit.repos.createCommitStatus({
      owner: repository.owner.login,
      repo: repository.name,
      sha: pull_request.head.sha,
      state,
      context: 'code-sensei/review',
      description: `Quality Score: ${reviewResult.overallScore}/100`,
      target_url: `${process.env.APP_URL}/reviews/${repository.owner.login}/${repository.name}/${pull_request.number}`,
    });

    // Send notifications
    await notificationService.sendReviewNotification({
      repo: repository.full_name,
      prNumber: pull_request.number,
      author: pull_request.user.login,
      result: reviewResult,
    });

    // Track analytics
    const reviewTime = Date.now() - startTime;
    await analyticsService.trackReview({
      repo: repository.full_name,
      prNumber: pull_request.number,
      score: reviewResult.overallScore,
      issuesFound: reviewResult.issues.length,
      reviewTime,
    });

    logger.info('PR review completed', {
      repo: repository.full_name,
      pr: pull_request.number,
      score: reviewResult.overallScore,
      issues: reviewResult.issues.length,
      duration: reviewTime,
    });
  } catch (error) {
    logger.error('Error during PR review', {
      repo: repository.full_name,
      pr: pull_request.number,
      error: error instanceof Error ? error.message : String(error),
    });

    // Update status to error
    await context.octokit.repos.createCommitStatus({
      owner: repository.owner.login,
      repo: repository.name,
      sha: pull_request.head.sha,
      state: 'error',
      context: 'code-sensei/review',
      description: 'An error occurred during review',
    });
  }
}

async function handleIssueComment(
  context: Context<'issue_comment.created'>,
  reviewService: ReviewService
) {
  const { comment, issue, repository } = context.payload;

  // Check if it's a PR comment
  if (!issue.pull_request) return;

  const body = comment.body.toLowerCase();

  // Handle commands
  if (body.includes('@code-sensei review')) {
    logger.info('Manual review requested via comment', {
      repo: repository.full_name,
      pr: issue.number,
    });

    await context.octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: issue.number,
      body: 'Starting a fresh review of this PR...',
    });

    // Trigger review
    // This would re-trigger the review process
  } else if (body.includes('@code-sensei fix')) {
    logger.info('Auto-fix requested via comment', {
      repo: repository.full_name,
      pr: issue.number,
    });

    await context.octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: issue.number,
      body: 'Analyzing code and preparing auto-fixes...',
    });

    // Trigger auto-fix
  } else if (body.includes('@code-sensei help')) {
    const helpMessage = `
## Code Sensei Commands

- \`@code-sensei review\` - Trigger a fresh review of this PR
- \`@code-sensei fix\` - Apply auto-fixes for common issues
- \`@code-sensei explain <file:line>\` - Explain code at specific location
- \`@code-sensei ignore <issue-id>\` - Ignore a specific issue
- \`@code-sensei help\` - Show this help message

For more information, visit our [documentation](https://code-sensei.dev/docs).
    `;

    await context.octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: issue.number,
      body: helpMessage,
    });
  }
}

async function handleInstallation(context: Context<'installation.created'>) {
  const { installation } = context.payload;

  logger.info('New installation', {
    account: installation.account.login,
    type: installation.account.type,
    repos: installation.repositories?.length || 0,
  });

  // Store installation in database
  // Send welcome notification
}

function formatReviewComment(result: AIReviewResult): string {
  const { summary, issues, positiveFindings, overallScore, recommendations } = result;

  let comment = `# 🥋 Code Sensei Review\n\n`;
  comment += `## Overall Score: ${overallScore}/100\n\n`;

  if (summary) {
    comment += `### Summary\n${summary}\n\n`;
  }

  if (positiveFindings.length > 0) {
    comment += `### ✅ Positive Findings\n`;
    positiveFindings.forEach((finding: string) => {
      comment += `- ${finding}\n`;
    });
    comment += `\n`;
  }

  if (issues.length > 0) {
    comment += `### 🔍 Issues Found (${issues.length})\n\n`;

    const criticalIssues = issues.filter((i: any) => i.severity === 'critical');
    const highIssues = issues.filter((i: any) => i.severity === 'high');
    const mediumIssues = issues.filter((i: any) => i.severity === 'medium');

    if (criticalIssues.length > 0) {
      comment += `#### 🚨 Critical (${criticalIssues.length})\n`;
      criticalIssues.slice(0, 5).forEach((issue: any) => {
        comment += `- **${issue.file}${issue.line ? `:${issue.line}` : ''}** - ${issue.message}\n`;
      });
      comment += `\n`;
    }

    if (highIssues.length > 0) {
      comment += `#### ⚠️ High (${highIssues.length})\n`;
      highIssues.slice(0, 5).forEach((issue: any) => {
        comment += `- **${issue.file}${issue.line ? `:${issue.line}` : ''}** - ${issue.message}\n`;
      });
      comment += `\n`;
    }

    if (mediumIssues.length > 0) {
      comment += `#### ℹ️ Medium (${mediumIssues.length})\n`;
      mediumIssues.slice(0, 3).forEach((issue: any) => {
        comment += `- **${issue.file}${issue.line ? `:${issue.line}` : ''}** - ${issue.message}\n`;
      });
      comment += `\n`;
    }
  }

  if (recommendations.length > 0) {
    comment += `### 💡 Recommendations\n`;
    recommendations.forEach((rec: string) => {
      comment += `- ${rec}\n`;
    });
    comment += `\n`;
  }

  comment += `\n---\n`;
  comment += `*Powered by Code Sensei | [Configure](${process.env.APP_URL}/settings) | [Docs](https://code-sensei.dev/docs)*`;

  return comment;
}
