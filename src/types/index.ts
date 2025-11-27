export interface PullRequestContext {
  owner: string;
  repo: string;
  pullNumber: number;
  sha: string;
  ref: string;
  baseBranch: string;
  author: string;
}

export interface CodeFile {
  filename: string;
  content: string;
  language: string;
  patch?: string;
  additions: number;
  deletions: number;
  changes: number;
}

export interface ReviewIssue {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'security' | 'performance' | 'maintainability' | 'style' | 'bug' | 'best-practice';
  message: string;
  file: string;
  line?: number;
  endLine?: number;
  column?: number;
  suggestion?: string;
  autoFixable: boolean;
  code?: string;
}

export interface AIReviewResult {
  summary: string;
  issues: ReviewIssue[];
  positiveFindings: string[];
  overallScore: number;
  recommendations: string[];
  complexityScore?: number;
  securityScore?: number;
  maintainabilityScore?: number;
}

export interface AnalysisResult {
  file: string;
  language: string;
  issues: ReviewIssue[];
  metrics: CodeMetrics;
  securityFindings?: SecurityFinding[];
  testCoverage?: number;
}

export interface CodeMetrics {
  linesOfCode: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  halsteadMetrics?: HalsteadMetrics;
}

export interface HalsteadMetrics {
  vocabulary: number;
  length: number;
  calculatedLength: number;
  volume: number;
  difficulty: number;
  effort: number;
  time: number;
  bugs: number;
}

export interface SecurityFinding {
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  file: string;
  line?: number;
  cwe?: string;
  owasp?: string;
  remediation?: string;
}

export interface AutoFixResult {
  file: string;
  original: string;
  fixed: string;
  diff: string;
  description: string;
  issuesFixed: string[];
}

export interface TeamConfig {
  repoOwner: string;
  repoName: string;
  styleGuide?: StyleGuide;
  customRules?: CustomRule[];
  ignoredPatterns?: string[];
  severityLevels?: Record<string, 'critical' | 'high' | 'medium' | 'low' | 'info'>;
  autoFixEnabled: boolean;
  autoMergeEnabled: boolean;
  requiredApprovals?: number;
}

export interface StyleGuide {
  indentation?: 'tabs' | 'spaces';
  indentSize?: number;
  lineLength?: number;
  namingConventions?: Record<string, string>;
  fileOrganization?: string[];
  importOrder?: string[];
}

export interface CustomRule {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  pattern?: string;
  message: string;
  autoFix?: string;
}

export interface ReviewStats {
  totalReviews: number;
  issuesFound: number;
  issuesFixed: number;
  averageReviewTime: number;
  mostCommonIssues: Array<{ issue: string; count: number }>;
  codeQualityTrend: Array<{ date: string; score: number }>;
}

export interface Installation {
  id: number;
  accountType: 'User' | 'Organization';
  accountLogin: string;
  repositories: string[];
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookPayload {
  action: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
  pull_request?: {
    number: number;
    title: string;
    state: string;
    head: {
      sha: string;
      ref: string;
    };
    base: {
      ref: string;
    };
    user: {
      login: string;
    };
  };
  installation?: {
    id: number;
  };
}

export interface NotificationConfig {
  slack?: {
    channelId: string;
    enabled: boolean;
  };
  jira?: {
    projectKey: string;
    issueType: string;
    enabled: boolean;
  };
  linear?: {
    teamId: string;
    enabled: boolean;
  };
}
