import { LinearClient } from '@linear/sdk';
import { config } from '../config';
import { logger } from '../utils/logger';

export class LinearIntegration {
  private client?: LinearClient;

  constructor() {
    if (config.integrations.linear?.apiKey) {
      this.client = new LinearClient({
        apiKey: config.integrations.linear.apiKey,
      });
    }
  }

  /**
   * Create Linear issue for critical findings
   */
  async createIssue(data: {
    teamId: string;
    title: string;
    description: string;
    priority?: number;
  }) {
    if (!this.client) {
      logger.warn('Linear integration not configured');
      return null;
    }

    try {
      const issue = await this.client.createIssue({
        teamId: data.teamId,
        title: data.title,
        description: data.description,
        priority: data.priority || 2,
      });

      logger.info('Linear issue created', { id: issue.issue?.id });
      return issue;
    } catch (error) {
      logger.error('Failed to create Linear issue', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}
