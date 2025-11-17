export interface CodeAnalysisResult {
  file: string;
  language: string;
  issues: Issue[];
  complexity: ComplexityMetrics;
  securityIssues: SecurityIssue[];
}

export interface Issue {
  type: 'error' | 'warning' | 'info';
  line: number;
  column?: number;
  message: string;
  rule?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  file: string;
  line?: number;
  cwe?: string;
  recommendation: string;
}

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  maintainabilityIndex: number;
}

export interface AIReviewResult {
  overallScore: number;
  architectureAnalysis: string;
  bestPractices: string[];
  codeSmells: CodeSmell[];
  refactoringSuggestions: RefactoringSuggestion[];
  summary: string;
}

export interface CodeSmell {
  type: string;
  description: string;
  location: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface RefactoringSuggestion {
  title: string;
  description: string;
  location: string;
  priority: 'high' | 'medium' | 'low';
  estimatedEffort: 'small' | 'medium' | 'large';
  code?: {
    before: string;
    after: string;
  };
}

export interface AutoFixResult {
  fixed: boolean;
  filesModified: string[];
  commit?: {
    sha: string;
    message: string;
  };
  testsAdded?: string[];
  formattingApplied: boolean;
}

export interface DashboardMetrics {
  totalReviews: number;
  averageScore: number;
  issuesFixed: number;
  securityVulnerabilitiesFound: number;
  recentReviews: ReviewSummary[];
}

export interface ReviewSummary {
  prNumber: number;
  repository: string;
  timestamp: string;
  score: number;
  issuesFound: number;
  autoFixed: boolean;
}
