import { Probot, Context } from 'probot';

export function setupStatusCheckHandlers(app: Probot) {
  // Handle check run requests
  app.on('check_run.requested_action', async (context: Context<'check_run.requested_action'>) => {
    const { check_run, repository, requested_action } = context.payload;
    
    app.log.info(`Check run action requested: ${requested_action.identifier}`);

    if (requested_action.identifier === 'rerun_analysis') {
      // Re-trigger analysis
      await context.octokit.checks.update({
        owner: repository.owner.login,
        repo: repository.name,
        check_run_id: check_run.id,
        status: 'in_progress',
      });

      // Logic to re-run analysis would go here
      app.log.info('Re-running analysis...');
    }
  });

  // Handle check suite events
  app.on('check_suite.requested', async (context: Context<'check_suite.requested'>) => {
    const { check_suite, repository } = context.payload;
    
    app.log.info(`Check suite requested for ${repository.full_name}`);

    await context.octokit.checks.create({
      owner: repository.owner.login,
      repo: repository.name,
      name: 'Code Sensei Review',
      head_sha: check_suite.head_sha,
      status: 'queued',
    });
  });

  // Handle check suite completion
  app.on('check_suite.completed', async (context: Context<'check_suite.completed'>) => {
    const { check_suite, repository } = context.payload;
    
    app.log.info(`Check suite completed for ${repository.full_name}: ${check_suite.conclusion}`);
  });
}
