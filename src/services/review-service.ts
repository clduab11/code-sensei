import { Octokit } from '@octokit/rest';
import { PullRequestContext, AIReviewResult, CodeFile, AnalysisResult } from '../types';
import { ClaudeReviewer } from '../ai/claude-reviewer';
import { ASTParser } from '../analysis/ast-parser';
import { SecurityScanner } from '../analysis/security-scanner';
import { StaticAnalyzer } from '../analysis/static-analyzer';
import { logger } from '../utils/logger';
import { config } from '../config';

export class ReviewService {
  private claudeReviewer: ClaudeReviewer;
  private astParser: ASTParser;
  private securityScanner: SecurityScanner;
  private staticAnalyzer: StaticAnalyzer;

  constructor() {
    this.claudeReviewer = new ClaudeReviewer();
    this.astParser = new ASTParser();
    this.securityScanner = new SecurityScanner();
    this.staticAnalyzer = new StaticAnalyzer();
  }

  /**
   * Main entry point for reviewing a pull request
   */
  async reviewPullRequest(
    context: PullRequestContext,
    octokit: Octokit
  ): Promise<AIReviewResult> {
    logger.info('Starting comprehensive PR review', {
      repo: `${context.owner}/${context.repo}`,
      pr: context.pullNumber,
    });

    try {
      // Fetch PR files
      const files = await this.fetchPRFiles(context, octokit);

      if (files.length === 0) {
        return this.getEmptyReviewResult();
      }

      // Limit files for analysis (to manage API costs)
      const filesToAnalyze = files.slice(0, 20);

      // Run parallel analysis
      const [astResults, securityResults, staticAnalysisResults] = await Promise.all([
        this.runASTAnalysis(filesToAnalyze),
        config.features.securityScan ? this.runSecurityScan(filesToAnalyze) : Promise.resolve([]),
        this.runStaticAnalysis(filesToAnalyze),
      ]);

      // Fetch PR details for context
      const prDetails = await octokit.pulls.get({
        owner: context.owner,
        repo: context.repo,
        pull_number: context.pullNumber,
      });

      // Perform AI review with Claude
      const aiReview = await this.claudeReviewer.reviewCode(filesToAnalyze, {
        prTitle: prDetails.data.title,
        prDescription: prDetails.data.body || '',
        baseBranch: context.baseBranch,
      });

      // Merge all findings
      const mergedResult = this.mergeAnalysisResults(
        aiReview,
        astResults,
        securityResults,
        staticAnalysisResults
      );

      logger.info('PR review completed', {
        repo: `${context.owner}/${context.repo}`,
        pr: context.pullNumber,
        score: mergedResult.overallScore,
        issueCount: mergedResult.issues.length,
      });

      return mergedResult;
    } catch (error) {
      logger.error('PR review failed', {
        repo: `${context.owner}/${context.repo}`,
        pr: context.pullNumber,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Fetch all files changed in the PR
   */
  private async fetchPRFiles(
    context: PullRequestContext,
    octokit: Octokit
  ): Promise<CodeFile[]> {
    const { data: prFiles } = await octokit.pulls.listFiles({
      owner: context.owner,
      repo: context.repo,
      pull_number: context.pullNumber,
      per_page: 100,
    });

    const files: CodeFile[] = [];

    for (const file of prFiles) {
      // Skip binary files and large files
      if (
        file.status === 'removed' ||
        file.changes > 1000 ||
        this.isBinaryFile(file.filename)
      ) {
        continue;
      }

      try {
        const { data: fileContent } = await octokit.repos.getContent({
          owner: context.owner,
          repo: context.repo,
          path: file.filename,
          ref: context.sha,
        });

        if ('content' in fileContent && fileContent.content) {
          const content = Buffer.from(fileContent.content, 'base64').toString('utf-8');

          files.push({
            filename: file.filename,
            content,
            language: this.detectLanguage(file.filename),
            patch: file.patch,
            additions: file.additions,
            deletions: file.deletions,
            changes: file.changes,
          });
        }
      } catch (error) {
        logger.warn('Failed to fetch file content', {
          file: file.filename,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return files;
  }

  /**
   * Run AST analysis on files
   */
  private async runASTAnalysis(files: CodeFile[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    for (const file of files) {
      try {
        const analysis = await this.astParser.analyzeCode(file.filename, file.content);
        results.push({
          file: file.filename,
          language: file.language,
          issues: analysis.issues,
          metrics: analysis.metrics,
        });
      } catch (error) {
        logger.warn('AST analysis failed for file', {
          file: file.filename,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * Run security scanning
   */
  private async runSecurityScan(files: CodeFile[]): Promise<AnalysisResult[]> {
    try {
      return await this.securityScanner.scanFiles(files);
    } catch (error) {
      logger.error('Security scan failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Run static analysis tools
   */
  private async runStaticAnalysis(files: CodeFile[]): Promise<AnalysisResult[]> {
    try {
      return await this.staticAnalyzer.analyzeFiles(files);
    } catch (error) {
      logger.error('Static analysis failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Merge results from all analysis sources
   */
  private mergeAnalysisResults(
    aiReview: AIReviewResult,
    astResults: AnalysisResult[],
    securityResults: AnalysisResult[],
    staticResults: AnalysisResult[]
  ): AIReviewResult {
    // Combine all issues
    const allIssues = [
      ...aiReview.issues,
      ...astResults.flatMap((r) => r.issues),
      ...securityResults.flatMap((r) => r.issues),
      ...staticResults.flatMap((r) => r.issues),
    ];

    // Deduplicate issues based on file, line, and message
    const uniqueIssues = this.deduplicateIssues(allIssues);

    // Sort by severity
    const sortedIssues = uniqueIssues.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    // Calculate adjusted overall score based on issues
    const adjustedScore = this.calculateAdjustedScore(aiReview.overallScore, sortedIssues);

    return {
      ...aiReview,
      issues: sortedIssues,
      overallScore: adjustedScore,
    };
  }

  /**
   * Deduplicate issues
   */
  private deduplicateIssues(issues: ReviewIssue[]) {
    const seen = new Set<string>();
    return issues.filter((issue) => {
      const key = `${issue.file}:${issue.line}:${issue.message}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Calculate adjusted score based on issues found
   */
  private calculateAdjustedScore(baseScore: number, issues: ReviewIssue[]): number {
    const severityPenalties = {
      critical: 10,
      high: 5,
      medium: 2,
      low: 1,
      info: 0,
    };

    let penalty = 0;
    for (const issue of issues) {
      penalty += severityPenalties[issue.severity] || 0;
    }

    return Math.max(0, Math.min(100, baseScore - penalty));
  }

  private isBinaryFile(filename: string): boolean {
    const binaryExtensions = [
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.ico',
      '.pdf',
      '.zip',
      '.tar',
      '.gz',
      '.exe',
      '.dll',
      '.so',
      '.dylib',
      '.woff',
      '.woff2',
      '.ttf',
      '.eot',
    ];

    return binaryExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
  }

  private detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      go: 'go',
      rs: 'rust',
      java: 'java',
      rb: 'ruby',
      php: 'php',
      cs: 'csharp',
      cpp: 'cpp',
      c: 'c',
      swift: 'swift',
      kt: 'kotlin',
    };
    return langMap[ext || ''] || 'text';
  }

  private getEmptyReviewResult(): AIReviewResult {
    return {
      summary: 'No files to review',
      overallScore: 100,
      positiveFindings: [],
      issues: [],
      recommendations: [],
    };
  }
}
