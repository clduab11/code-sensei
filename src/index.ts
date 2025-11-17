import { Probot } from 'probot';
import { config } from './config';
import { logger } from './utils/logger';
import { setupWebhooks } from './github/webhooks';
import { startDashboard } from './dashboard/server';
import { initializeDatabase } from './database';
import { initializeRedis } from './cache/redis';

/**
 * Main entry point for Code Sensei GitHub App
 */
export = (app: Probot) => {
  logger.info('Code Sensei is starting...');

  // Initialize database and cache
  initializeDatabase()
    .then(() => logger.info('Database initialized'))
    .catch((error) => logger.error('Database initialization failed:', error));

  initializeRedis()
    .then(() => logger.info('Redis cache initialized'))
    .catch((error) => logger.error('Redis initialization failed:', error));

  // Setup GitHub webhooks
  setupWebhooks(app);

  // Start web dashboard
  if (config.dashboard.enabled) {
    startDashboard(config.dashboard.port);
  }

  logger.info('Code Sensei successfully started!');
  logger.info(`Environment: ${config.env}`);
  logger.info(`AI Model: ${config.ai.model}`);
};
