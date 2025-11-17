import { ReviewIssue, TeamConfig } from '../types';
import { logger } from '../utils/logger';
import { getDatabase } from '../database';

export class LearningService {
  /**
   * Learn from false positive feedback
   */
  async recordFalsePositive(
    repoId: number,
    issue: ReviewIssue,
    feedback: {
      userId: string;
      reason: string;
    }
  ) {
    try {
      const db = getDatabase();
      await db.query(
        `INSERT INTO false_positives (repository_id, issue_category, issue_code, message, feedback_reason, user_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [repoId, issue.category, issue.code, issue.message, feedback.reason, feedback.userId]
      );

      logger.info('False positive recorded', {
        repo: repoId,
        category: issue.category,
        code: issue.code,
      });

      // Update team config to ignore this pattern in the future
      await this.updateTeamConfig(repoId, issue);
    } catch (error) {
      logger.error('Failed to record false positive', { error });
    }
  }

  /**
   * Get team-specific configuration
   */
  async getTeamConfig(repoId: number): Promise<TeamConfig | null> {
    try {
      const db = getDatabase();
      const result = await db.query(
        'SELECT config FROM team_configs WHERE repository_id = $1 ORDER BY updated_at DESC LIMIT 1',
        [repoId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0].config as TeamConfig;
    } catch (error) {
      logger.error('Failed to get team config', { error });
      return null;
    }
  }

  /**
   * Update team configuration based on feedback
   */
  private async updateTeamConfig(repoId: number, issue: ReviewIssue) {
    try {
      const db = getDatabase();
      const existingConfig = await this.getTeamConfig(repoId);

      const updatedConfig = existingConfig || {
        repoOwner: '',
        repoName: '',
        customRules: [],
        ignoredPatterns: [],
        autoFixEnabled: true,
        autoMergeEnabled: false,
      };

      // Add to ignored patterns
      if (issue.code && !updatedConfig.ignoredPatterns?.includes(issue.code)) {
        updatedConfig.ignoredPatterns = [...(updatedConfig.ignoredPatterns || []), issue.code];
      }

      await db.query(
        `INSERT INTO team_configs (repository_id, config, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (repository_id)
         DO UPDATE SET config = $2, updated_at = CURRENT_TIMESTAMP`,
        [repoId, JSON.stringify(updatedConfig)]
      );

      logger.info('Team config updated', { repo: repoId });
    } catch (error) {
      logger.error('Failed to update team config', { error });
    }
  }

  /**
   * Analyze historical patterns
   */
  async analyzeHistoricalPatterns(repoId: number) {
    try {
      const db = getDatabase();

      // Get most common issues
      const commonIssues = await db.query(
        `SELECT category, message, COUNT(*) as count
         FROM issues i
         JOIN reviews r ON i.review_id = r.id
         WHERE r.repository_id = $1
         GROUP BY category, message
         ORDER BY count DESC
         LIMIT 10`,
        [repoId]
      );

      // Get severity trends
      const severityTrends = await db.query(
        `SELECT
           DATE(created_at) as date,
           severity,
           COUNT(*) as count
         FROM issues i
         JOIN reviews r ON i.review_id = r.id
         WHERE r.repository_id = $1
           AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at), severity
         ORDER BY date DESC`,
        [repoId]
      );

      return {
        commonIssues: commonIssues.rows,
        severityTrends: severityTrends.rows,
      };
    } catch (error) {
      logger.error('Failed to analyze historical patterns', { error });
      return { commonIssues: [], severityTrends: [] };
    }
  }

  /**
   * Get developer-specific preferences
   */
  async getDeveloperPreferences(userId: string) {
    try {
      const db = getDatabase();
      const result = await db.query(
        'SELECT preferences FROM developer_preferences WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return this.getDefaultPreferences();
      }

      return result.rows[0].preferences;
    } catch (error) {
      logger.error('Failed to get developer preferences', { error });
      return this.getDefaultPreferences();
    }
  }

  private getDefaultPreferences() {
    return {
      notificationsEnabled: true,
      autoFixPreference: 'ask', // 'always', 'never', 'ask'
      severityThreshold: 'medium',
      preferredLanguages: [],
    };
  }
}
