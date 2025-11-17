import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

export async function initializeDatabase() {
  try {
    pool = new Pool({
      connectionString: config.database.url,
      ssl: config.env === 'production' ? { rejectUnauthorized: false } : false,
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
      repository_id INTEGER REFERENCES repositories(id),
      config JSONB NOT NULL,
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
