import { WebClient } from '@slack/web-api';
import { config } from '../config';
import { logger } from '../utils/logger';

export class NotificationService {
  private slack?: WebClient;

  constructor() {
    if (config.integrations.slack?.botToken) {
      this.slack = new WebClient(config.integrations.slack.botToken);
    }
  }

  /**
   * Send review notification
   */
  async sendReviewNotification(data: {
    repo: string;
    prNumber: number;
    author: string;
    result: any;
  }) {
    // Send Slack notification
    if (this.slack) {
      await this.sendSlackNotification(data);
    }

    // Could add more notification channels here (email, webhook, etc.)
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(data: {
    repo: string;
    prNumber: number;
    author: string;
    result: any;
  }) {
    try {
      const scoreEmoji = this.getScoreEmoji(data.result.overallScore);
      const severityEmoji = {
        critical: '🚨',
        high: '⚠️',
        medium: 'ℹ️',
        low: '💡',
        info: '📝',
      };

      const criticalCount = data.result.issues.filter(
        (i: any) => i.severity === 'critical'
      ).length;
      const highCount = data.result.issues.filter((i: any) => i.severity === 'high').length;

      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${scoreEmoji} Code Review Complete`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Repository:*\n${data.repo}`,
            },
            {
              type: 'mrkdwn',
              text: `*PR #:*\n${data.prNumber}`,
            },
            {
              type: 'mrkdwn',
              text: `*Author:*\n@${data.author}`,
            },
            {
              type: 'mrkdwn',
              text: `*Score:*\n${data.result.overallScore}/100`,
            },
          ],
        },
      ];

      if (data.result.issues.length > 0) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Issues Found:*\n${severityEmoji.critical} Critical: ${criticalCount}\n${severityEmoji.high} High: ${highCount}\n📊 Total: ${data.result.issues.length}`,
          },
        } as any);
      }

      await this.slack!.chat.postMessage({
        channel: config.integrations.slack?.defaultChannel || '#code-reviews',
        blocks,
        text: `Code review completed for ${data.repo} PR #${data.prNumber}`,
      });

      logger.info('Slack notification sent');
    } catch (error) {
      logger.error('Failed to send Slack notification', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private getScoreEmoji(score: number): string {
    if (score >= 90) return '🎉';
    if (score >= 80) return '✅';
    if (score >= 70) return '👍';
    if (score >= 60) return '⚠️';
    return '❌';
  }
}
