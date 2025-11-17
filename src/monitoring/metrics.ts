import { register, Counter, Histogram, Gauge } from 'prom-client';

// Review metrics
export const reviewsTotal = new Counter({
  name: 'code_sensei_reviews_total',
  help: 'Total number of code reviews performed',
  labelNames: ['repo', 'status'],
});

export const reviewDuration = new Histogram({
  name: 'code_sensei_review_duration_seconds',
  help: 'Duration of code reviews in seconds',
  labelNames: ['repo'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
});

export const issuesFound = new Counter({
  name: 'code_sensei_issues_found_total',
  help: 'Total number of issues found',
  labelNames: ['repo', 'severity', 'category'],
});

export const autoFixesApplied = new Counter({
  name: 'code_sensei_auto_fixes_applied_total',
  help: 'Total number of auto-fixes applied',
  labelNames: ['repo'],
});

export const codeQualityScore = new Gauge({
  name: 'code_sensei_quality_score',
  help: 'Code quality score (0-100)',
  labelNames: ['repo'],
});

// API metrics
export const httpRequestsTotal = new Counter({
  name: 'code_sensei_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

export const httpRequestDuration = new Histogram({
  name: 'code_sensei_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.3, 0.5, 1, 3, 5],
});

// AI metrics
export const aiRequestsTotal = new Counter({
  name: 'code_sensei_ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['model', 'status'],
});

export const aiTokensUsed = new Counter({
  name: 'code_sensei_ai_tokens_used_total',
  help: 'Total number of AI tokens used',
  labelNames: ['model', 'type'],
});

export { register };
