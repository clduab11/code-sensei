import { Probot, Context } from 'probot';

export function setupAutoMergeHandlers(app: Probot) {
  // Handle check suite completion for auto-merge
  app.on('check_suite.completed', async (context: Context<'check_suite.completed'>) => {
    const { check_suite, repository } = context.payload;
    
    // Only proceed if auto-merge is enabled
    const autoMergeEnabled = process.env.AUTO_MERGE_ENABLED === 'true';
    if (!autoMergeEnabled) {
      return;
    }

    // Check if all checks passed
    if (check_suite.conclusion !== 'success') {
      app.log.info('Check suite not successful, skipping auto-merge');
      return;
    }

    // Find associated PRs
    const pulls = await context.octokit.pulls.list({
      owner: repository.owner.login,
      repo: repository.name,
      state: 'open',
      head: `${repository.owner.login}:${check_suite.head_branch}`,
    });

    for (const pull of pulls.data) {
      // Check if PR has auto-merge label
      const hasAutoMergeLabel = pull.labels.some(label => label.name === 'auto-merge');
      
      if (!hasAutoMergeLabel) {
        continue;
      }

      // Check if PR is approved
      const reviews = await context.octokit.pulls.listReviews({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pull.number,
      });

      const hasApproval = reviews.data.some(review => review.state === 'APPROVED');
      
      if (!hasApproval) {
        app.log.info(`PR #${pull.number} not approved, skipping auto-merge`);
        continue;
      }

      // Check if Code Sensei review score is acceptable
      const comments = await context.octokit.issues.listComments({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: pull.number,
      });

      const senseiComment = comments.data.find(comment => 
        comment.body?.includes('Code Sensei AI Review')
      );

      let scoreAcceptable = true;
      if (senseiComment) {
        const scoreMatch = senseiComment.body?.match(/Overall Score:\*\* (\d+)\/100/);
        if (scoreMatch) {
          const score = parseInt(scoreMatch[1]);
          const minScore = parseInt(process.env.AUTO_MERGE_MIN_SCORE || '80');
          scoreAcceptable = score >= minScore;
        }
      }

      if (!scoreAcceptable) {
        app.log.info(`PR #${pull.number} score too low, skipping auto-merge`);
        continue;
      }

      try {
        // Merge the PR
        await context.octokit.pulls.merge({
          owner: repository.owner.login,
          repo: repository.name,
          pull_number: pull.number,
          merge_method: 'squash',
          commit_title: `Auto-merge: ${pull.title}`,
          commit_message: `Automatically merged by Code Sensei after passing all checks and reviews.`,
        });

        app.log.info(`Successfully auto-merged PR #${pull.number}`);

        // Post comment about auto-merge
        await context.octokit.issues.createComment({
          owner: repository.owner.login,
          repo: repository.name,
          issue_number: pull.number,
          body: '✅ Auto-merged by Code Sensei after passing all checks and reviews.',
        });

      } catch (error) {
        app.log.error(`Failed to auto-merge PR #${pull.number}: ${error}`);
      }
    }
  });
}
