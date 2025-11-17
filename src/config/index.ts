import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const ConfigSchema = z.object({
  env: z.enum(['development', 'production', 'test']).default('development'),
  port: z.number().default(3000),
  logLevel: z.string().default('info'),
  appUrl: z.string().url(),

  github: z.object({
    appId: z.string(),
    privateKeyPath: z.string(),
    webhookSecret: z.string(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
  }),

  ai: z.object({
    apiKey: z.string(),
    model: z.string().default('claude-opus-4-20250514'),
    maxTokens: z.number().default(4096),
  }),

  database: z.object({
    url: z.string(),
  }),

  redis: z.object({
    url: z.string(),
  }),

  security: z.object({
    jwtSecret: z.string(),
    sessionSecret: z.string(),
  }),

  integrations: z.object({
    slack: z.object({
      botToken: z.string().optional(),
      signingSecret: z.string().optional(),
    }).optional(),
    jira: z.object({
      host: z.string().optional(),
      email: z.string().optional(),
      apiToken: z.string().optional(),
    }).optional(),
    linear: z.object({
      apiKey: z.string().optional(),
    }).optional(),
    snyk: z.object({
      token: z.string().optional(),
    }).optional(),
  }),

  features: z.object({
    autoFix: z.boolean().default(true),
    autoMerge: z.boolean().default(false),
    securityScan: z.boolean().default(true),
    learning: z.boolean().default(true),
  }),

  dashboard: z.object({
    enabled: z.boolean().default(true),
    port: z.number().default(3001),
  }),

  monitoring: z.object({
    sentryDsn: z.string().optional(),
    prometheusPort: z.number().default(9090),
  }),

  rateLimit: z.object({
    windowMs: z.number().default(900000),
    maxRequests: z.number().default(100),
  }),

  pricing: z.object({
    freeMaxRepos: z.number().default(3),
    proPrice: z.number().default(19),
    enterpriseCustom: z.boolean().default(true),
  }),
});

export const config = ConfigSchema.parse({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  appUrl: process.env.APP_URL || 'http://localhost:3000',

  github: {
    appId: process.env.GITHUB_APP_ID,
    privateKeyPath: process.env.GITHUB_PRIVATE_KEY_PATH || './private-key.pem',
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  },

  ai: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.CLAUDE_MODEL || 'claude-opus-4-20250514',
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4096', 10),
  },

  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/code_sensei',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  security: {
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    sessionSecret: process.env.SESSION_SECRET || 'change-me-in-production',
  },

  integrations: {
    slack: {
      botToken: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
    },
    jira: {
      host: process.env.JIRA_HOST,
      email: process.env.JIRA_EMAIL,
      apiToken: process.env.JIRA_API_TOKEN,
    },
    linear: {
      apiKey: process.env.LINEAR_API_KEY,
    },
    snyk: {
      token: process.env.SNYK_TOKEN,
    },
  },

  features: {
    autoFix: process.env.ENABLE_AUTO_FIX === 'true',
    autoMerge: process.env.ENABLE_AUTO_MERGE === 'true',
    securityScan: process.env.ENABLE_SECURITY_SCAN === 'true',
    learning: process.env.ENABLE_LEARNING === 'true',
  },

  dashboard: {
    enabled: true,
    port: parseInt(process.env.DASHBOARD_PORT || '3001', 10),
  },

  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    prometheusPort: parseInt(process.env.PROMETHEUS_PORT || '9090', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  pricing: {
    freeMaxRepos: parseInt(process.env.TIER_FREE_MAX_REPOS || '3', 10),
    proPrice: parseInt(process.env.TIER_PRO_PRICE || '19', 10),
    enterpriseCustom: process.env.TIER_ENTERPRISE_CUSTOM === 'true',
  },
});

export type Config = z.infer<typeof ConfigSchema>;
