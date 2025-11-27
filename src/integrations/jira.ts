import JiraClient from 'jira-client';
import { config } from '../config';
import { logger } from '../utils/logger';

export class JiraIntegration {
  private client?: JiraClient;

  constructor() {
    if (
      config.integrations.jira?.host &&
      config.integrations.jira.email &&
      config.integrations.jira.apiToken
    ) {
      this.client = new JiraClient({
        protocol: 'https',
        host: config.integrations.jira.host,
        username: config.integrations.jira.email,
        password: config.integrations.jira.apiToken,
        apiVersion: '2',
        strictSSL: true,
      });
    }
  }

  /**
   * Create Jira issue for critical findings
   */
  async createIssue(data: {
    projectKey: string;
    summary: string;
    description: string;
    issueType?: string;
  }) {
    if (!this.client) {
      logger.warn('Jira integration not configured');
      return null;
    }

    try {
      const issue = await this.client.addNewIssue({
        fields: {
          project: { key: data.projectKey },
          summary: data.summary,
          description: data.description,
          issuetype: { name: data.issueType || 'Bug' },
        },
      });

      logger.info('Jira issue created', { key: issue.key });
      return issue;
    } catch (error) {
      logger.error('Failed to create Jira issue', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}
