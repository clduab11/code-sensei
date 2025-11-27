import { Pool, PoolConfig } from 'pg';
import { readFileSync } from 'fs';
import { config } from '../config';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

/**
 * Builds the SSL configuration for the PostgreSQL connection.
 * 
 * SSL Configuration:
 * - DB_SSL: Enable/disable SSL (true/false). Defaults to true in production.
 * - DB_SSL_REJECT_UNAUTHORIZED: Verify server certificate (true/false). 
 *   Defaults to true in production for security. Set to false only when using
 *   self-signed certificates or providers that don't support full verification
 *   (e.g., some Heroku/AWS setups). See DEPLOYMENT.md#database-ssl-configuration.
 * - DB_SSL_CA_PATH: Path to a CA certificate file for custom certificate validation.
 */
function buildSslConfig(): PoolConfig['ssl'] {
  // In non-production environments, SSL is disabled by default unless explicitly enabled
  const sslEnabled = process.env.DB_SSL !== undefined
    ? process.env.DB_SSL === 'true'
    : config.env === 'production';

  if (!sslEnabled) {
    return false;
  }

  // Default to rejecting unauthorized certificates in production for security
  // This can be disabled via DB_SSL_REJECT_UNAUTHORIZED=false for providers
  // that use self-signed or unverifiable certificates
  const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== undefined
    ? process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
    : config.env === 'production';

  const sslConfig: { rejectUnauthorized: boolean; ca?: string } = {
    rejectUnauthorized,
  };

  // Load custom CA certificate if provided
  const caPath = process.env.DB_SSL_CA_PATH;
  if (caPath) {
    try {
      sslConfig.ca = readFileSync(caPath, 'utf-8');
      logger.info('Loaded custom CA certificate for database SSL', { caPath });
    } catch (error) {
      logger.error('Failed to load CA certificate file', {
        caPath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Failed to load CA certificate from ${caPath}`);
    }
  }

  return sslConfig;
}

export async function initializeDatabase() {
  try {
    pool = new Pool({
      connectionString: config.database.url,
      ssl: buildSslConfig(),
    });

    await pool.query('SELECT NOW()');
    logger.info('Database connection established');

    // Create tables if they don't exist
    await createTables();
  } catch (error) {
    logger.error('Database initialization failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function createTables() {
  const createTablesSQL = `
    CREATE TABLE IF NOT EXISTS installations (
      id SERIAL PRIMARY KEY,
      github_installation_id INTEGER UNIQUE NOT NULL,
      account_type VARCHAR(50) NOT NULL,
      account_login VARCHAR(255) NOT NULL,
      tier VARCHAR(50) DEFAULT 'free',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS repositories (
      id SERIAL PRIMARY KEY,
      installation_id INTEGER REFERENCES installations(id),
      github_repo_id INTEGER UNIQUE NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      repository_id INTEGER REFERENCES repositories(id),
      pr_number INTEGER NOT NULL,
      commit_sha VARCHAR(40) NOT NULL,
      author VARCHAR(255) NOT NULL,
      overall_score INTEGER,
      security_score INTEGER,
      maintainability_score INTEGER,
      issues_found INTEGER DEFAULT 0,
      review_time_ms INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS issues (
      id SERIAL PRIMARY KEY,
      review_id INTEGER REFERENCES reviews(id),
      severity VARCHAR(20) NOT NULL,
      category VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      file VARCHAR(500),
      line INTEGER,
      suggestion TEXT,
      auto_fixable BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS team_configs (
      id SERIAL PRIMARY KEY,
      repository_id INTEGER UNIQUE REFERENCES repositories(id),
      config JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS false_positives (
      id SERIAL PRIMARY KEY,
      repository_id INTEGER REFERENCES repositories(id),
      issue_category VARCHAR(50) NOT NULL,
      issue_code VARCHAR(100),
      message TEXT NOT NULL,
      feedback_reason TEXT,
      user_id VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS developer_preferences (
      id SERIAL PRIMARY KEY,
      repository_id INTEGER REFERENCES repositories(id),
      user_id VARCHAR(255) NOT NULL,
      preferences JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_repo ON reviews(repository_id);
    CREATE INDEX IF NOT EXISTS idx_issues_review ON issues(review_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at);
  `;

  if (pool) {
    await pool.query(createTablesSQL);
    logger.info('Database tables created/verified');
  }
}

export function getDatabase() {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  return pool;
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection closed');
  }
}
