import { Express, Request, Response } from 'express';
import { getDatabase } from '../database';
import { logger } from '../utils/logger';

export function setupRoutes(app: Express) {
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.get('/api/stats/repository/:owner/:repo', getRepositoryStats);
  app.get('/api/reviews/repository/:owner/:repo', getRepositoryReviews);
  app.get('/api/reviews/:reviewId', getReviewDetails);
  app.get('/api/trends/:owner/:repo', getQualityTrends);
  app.get('/api/issues/common/:owner/:repo', getCommonIssues);

  // Dashboard UI (would serve React/Vue app in production)
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Code Sensei Dashboard</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              max-width: 1200px;
              margin: 0 auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px;
              border-radius: 10px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 2.5em;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.9;
            }
            .card {
              background: white;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }
            .stat {
              text-align: center;
            }
            .stat-value {
              font-size: 3em;
              font-weight: bold;
              color: #667eea;
            }
            .stat-label {
              color: #666;
              margin-top: 5px;
            }
            .feature {
              margin: 15px 0;
              padding: 15px;
              background: #f9f9f9;
              border-left: 4px solid #667eea;
            }
            .feature h3 {
              margin: 0 0 10px 0;
              color: #333;
            }
            .feature p {
              margin: 0;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🥋 Code Sensei</h1>
            <p>Intelligent Code Review & Analysis Platform</p>
          </div>

          <div class="stats">
            <div class="card stat">
              <div class="stat-value">∞</div>
              <div class="stat-label">Reviews Completed</div>
            </div>
            <div class="card stat">
              <div class="stat-value">100</div>
              <div class="stat-label">Quality Score</div>
            </div>
            <div class="card stat">
              <div class="stat-value">0</div>
              <div class="stat-label">Issues Found</div>
            </div>
          </div>

          <div class="card">
            <h2>Features</h2>
            <div class="feature">
              <h3>🤖 AI-Powered Reviews</h3>
              <p>Claude Opus analyzes your code for best practices, security issues, and performance optimizations</p>
            </div>
            <div class="feature">
              <h3>🔒 Security Scanning</h3>
              <p>Automatic detection of vulnerabilities including SQL injection, XSS, and hardcoded secrets</p>
            </div>
            <div class="feature">
              <h3>🛠️ Auto-Fix System</h3>
              <p>Automatically fixes common issues and creates commits with improvements</p>
            </div>
            <div class="feature">
              <h3>📊 Analytics Dashboard</h3>
              <p>Track code quality trends, common issues, and team performance over time</p>
            </div>
            <div class="feature">
              <h3>🎯 Learning System</h3>
              <p>Adapts to your team's preferences and learns from feedback</p>
            </div>
            <div class="feature">
              <h3>🔌 Integrations</h3>
              <p>Connect with Slack, Jira, Linear, and more</p>
            </div>
          </div>

          <div class="card">
            <h2>API Endpoints</h2>
            <ul>
              <li><code>GET /api/stats/repository/:owner/:repo</code> - Repository statistics</li>
              <li><code>GET /api/reviews/repository/:owner/:repo</code> - Recent reviews</li>
              <li><code>GET /api/reviews/:reviewId</code> - Review details</li>
              <li><code>GET /api/trends/:owner/:repo</code> - Quality trends</li>
              <li><code>GET /api/issues/common/:owner/:repo</code> - Common issues</li>
            </ul>
          </div>
        </body>
      </html>
    `);
  });
}

async function getRepositoryStats(req: Request, res: Response) {
  try {
    const { owner, repo } = req.params;
    const db = getDatabase();

    const stats = await db.query(
      `SELECT
        COUNT(*) as total_reviews,
        AVG(overall_score) as avg_score,
        SUM(issues_found) as total_issues,
        AVG(review_time_ms) as avg_review_time
       FROM reviews r
       JOIN repositories rp ON r.repository_id = rp.id
       WHERE rp.full_name = $1`,
      [`${owner}/${repo}`]
    );

    res.json(stats.rows[0]);
  } catch (error) {
    logger.error('Failed to get repository stats', { error });
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

async function getRepositoryReviews(req: Request, res: Response) {
  try {
    const { owner, repo } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const db = getDatabase();

    const reviews = await db.query(
      `SELECT r.*, rp.full_name
       FROM reviews r
       JOIN repositories rp ON r.repository_id = rp.id
       WHERE rp.full_name = $1
       ORDER BY r.created_at DESC
       LIMIT $2`,
      [`${owner}/${repo}`, limit]
    );

    res.json(reviews.rows);
  } catch (error) {
    logger.error('Failed to get repository reviews', { error });
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}

async function getReviewDetails(req: Request, res: Response) {
  try {
    const { reviewId } = req.params;
    const db = getDatabase();

    const review = await db.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);

    if (review.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const issues = await db.query('SELECT * FROM issues WHERE review_id = $1', [reviewId]);

    res.json({
      ...review.rows[0],
      issues: issues.rows,
    });
  } catch (error) {
    logger.error('Failed to get review details', { error });
    res.status(500).json({ error: 'Failed to fetch review details' });
  }
}

async function getQualityTrends(req: Request, res: Response) {
  try {
    const { owner, repo } = req.params;
    const days = Math.min(parseInt(req.query.days as string) || 30, 365);
    const db = getDatabase();

    const trends = await db.query(
      `SELECT
        DATE(created_at) as date,
        AVG(overall_score) as avg_score,
        COUNT(*) as review_count,
        SUM(issues_found) as total_issues
       FROM reviews r
       JOIN repositories rp ON r.repository_id = rp.id
       WHERE rp.full_name = $1
         AND created_at > NOW() - ($2 || ' days')::interval
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [`${owner}/${repo}`, days]
    );

    res.json(trends.rows);
  } catch (error) {
    logger.error('Failed to get quality trends', { error });
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
}

async function getCommonIssues(req: Request, res: Response) {
  try {
    const { owner, repo } = req.params;
    const db = getDatabase();

    const issues = await db.query(
      `SELECT
        category,
        severity,
        message,
        COUNT(*) as count
       FROM issues i
       JOIN reviews r ON i.review_id = r.id
       JOIN repositories rp ON r.repository_id = rp.id
       WHERE rp.full_name = $1
       GROUP BY category, severity, message
       ORDER BY count DESC
       LIMIT 20`,
      [`${owner}/${repo}`]
    );

    res.json(issues.rows);
  } catch (error) {
    logger.error('Failed to get common issues', { error });
    res.status(500).json({ error: 'Failed to fetch common issues' });
  }
}
