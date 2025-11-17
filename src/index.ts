import { Probot, Context } from 'probot';
import { setupPRHandlers } from './handlers/pullRequestHandler';
import { setupStatusCheckHandlers } from './handlers/statusCheckHandler';
import { setupAutoMergeHandlers } from './handlers/autoMergeHandler';
import dotenv from 'dotenv';

dotenv.config();

export default (app: Probot) => {
  app.log.info('Code Sensei bot is starting...');

  // Setup all handlers
  setupPRHandlers(app);
  setupStatusCheckHandlers(app);
  setupAutoMergeHandlers(app);

  app.on('installation.created', async (context: Context<'installation.created'>) => {
    app.log.info('App installed on repository');
  });

  app.on('installation.deleted', async (context: Context<'installation.deleted'>) => {
    app.log.info('App uninstalled from repository');
  });

  app.log.info('Code Sensei bot is ready!');
};
